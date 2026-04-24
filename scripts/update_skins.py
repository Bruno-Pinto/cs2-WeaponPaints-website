#!/usr/bin/env python3
"""Update website skin JSON files from ByMykel CSGO-API.

Behavior:
- Replaces English skins with latest upstream `en/skins.json`.
- Replaces Simplified Chinese skins with latest upstream `zh-CN/skins.json`.
- For `pt-BR` and `ru`, keeps current localized entries and appends missing skins from English,
  so new releases become available even when upstream locale data is unavailable.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

BASE_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api"

ROOT = Path(__file__).resolve().parent.parent
SKINS_DIR = ROOT / "web" / "public" / "js" / "json" / "skins"

TARGET_FILES = {
    "en": SKINS_DIR / "en-skins.json",
    "zh-CN": SKINS_DIR / "zh-CN-skins.json",
    "pt-BR": SKINS_DIR / "pt-BR-skins.json",
    "ru": SKINS_DIR / "ru-skins.json",
}


def to_int(value: object) -> Optional[int]:
    try:
        return int(str(value))
    except Exception:
        return None


def skin_key(item: Dict) -> Tuple[Optional[str], Optional[int]]:
    weapon_id = item.get("weapon", {}).get("id")
    paint_index = to_int(item.get("paint_index"))
    return weapon_id, paint_index


def fetch_json(url: str) -> List[Dict]:
    with urllib.request.urlopen(url, timeout=60) as response:
        return json.load(response)


def load_local(path: Path) -> List[Dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: List[Dict]) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def merge_localized_with_source(
    base_local: List[Dict], source: List[Dict]
) -> Tuple[List[Dict], int, int]:
    """Keep localized rows, sync image URLs from source, and append missing rows.

    This preserves translated names/descriptions in pt-BR/ru while ensuring
    image links track upstream fixes.
    """
    source_by_key = {skin_key(item): item for item in source if skin_key(item)[1] is not None}

    merged: List[Dict] = []
    seen_keys = set()
    synced_images = 0

    for item in base_local:
        key = skin_key(item)
        if key[1] is None:
            merged.append(item)
            continue

        seen_keys.add(key)
        source_item = source_by_key.get(key)
        if source_item is None:
            merged.append(item)
            continue

        merged_item = dict(item)
        source_image = source_item.get("image")
        if source_image and merged_item.get("image") != source_image:
            merged_item["image"] = source_image
            synced_images += 1

        merged.append(merged_item)

    missing = [item for item in source if skin_key(item)[1] is not None and skin_key(item) not in seen_keys]
    return merged + missing, len(missing), synced_images


def summarize(name: str, before: Iterable[Dict], after: Iterable[Dict]) -> str:
    before_list = list(before)
    after_list = list(after)
    before_keys = {skin_key(i) for i in before_list if skin_key(i)[1] is not None}
    after_keys = {skin_key(i) for i in after_list if skin_key(i)[1] is not None}
    added = len(after_keys - before_keys)
    removed = len(before_keys - after_keys)
    return f"{name}: {len(before_list)} -> {len(after_list)} (added {added}, removed {removed})"


def validate_target_files() -> None:
    missing = [str(path) for path in TARGET_FILES.values() if not path.exists()]
    if missing:
        print("Missing target files:")
        for file in missing:
            print(f"  - {file}")
        sys.exit(1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Update local skin JSON files from upstream data.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write changes to files. Without this flag, runs in dry-run mode.",
    )
    args = parser.parse_args()

    validate_target_files()

    print("Fetching upstream data...")
    upstream_en = fetch_json(f"{BASE_URL}/en/skins.json")
    upstream_zh = fetch_json(f"{BASE_URL}/zh-CN/skins.json")

    local_en = load_local(TARGET_FILES["en"])
    local_zh = load_local(TARGET_FILES["zh-CN"])
    local_pt = load_local(TARGET_FILES["pt-BR"])
    local_ru = load_local(TARGET_FILES["ru"])

    next_en = upstream_en
    next_zh = upstream_zh
    next_pt, pt_added, pt_synced_images = merge_localized_with_source(local_pt, upstream_en)
    next_ru, ru_added, ru_synced_images = merge_localized_with_source(local_ru, upstream_en)

    print(summarize("en", local_en, next_en))
    print(summarize("zh-CN", local_zh, next_zh))
    print(
        summarize("pt-BR", local_pt, next_pt)
        + f" | appended_from_en={pt_added}"
        + f" | synced_images={pt_synced_images}"
    )
    print(
        summarize("ru", local_ru, next_ru)
        + f" | appended_from_en={ru_added}"
        + f" | synced_images={ru_synced_images}"
    )

    if not args.apply:
        print("Dry-run complete. Re-run with --apply to write files.")
        return 0

    dump_json(TARGET_FILES["en"], next_en)
    dump_json(TARGET_FILES["zh-CN"], next_zh)
    dump_json(TARGET_FILES["pt-BR"], next_pt)
    dump_json(TARGET_FILES["ru"], next_ru)
    print("Updated skin files written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
