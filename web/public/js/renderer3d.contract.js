(function () {
    const MAX_STICKER_SLOTS = 5;

    function clampNumber(value, min, max, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        if (parsed < min) {
            return min;
        }

        if (parsed > max) {
            return max;
        }

        return parsed;
    }

    function clampInteger(value, min, max, fallback) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        if (parsed < min) {
            return min;
        }

        if (parsed > max) {
            return max;
        }

        return parsed;
    }

    function normalizeStickerEntry(entry, index) {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const stickerId = String(entry.stickerId || entry.id || '').trim();
        if (!stickerId) {
            return null;
        }

        return {
            slot: clampInteger(entry.slot, 0, MAX_STICKER_SLOTS - 1, index),
            stickerId: stickerId.slice(0, 128),
            position: {
                x: clampNumber(entry.position && entry.position.x, -2, 2, 0),
                y: clampNumber(entry.position && entry.position.y, -2, 2, 0)
            },
            rotation: clampNumber(entry.rotation, -180, 180, 0),
            scale: clampNumber(entry.scale, 0.05, 4, 1),
            wear: clampNumber(entry.wear, 0, 1, 0)
        };
    }

    function normalizeStickers(stickers) {
        if (!Array.isArray(stickers)) {
            return [];
        }

        return stickers
            .slice(0, MAX_STICKER_SLOTS)
            .map(normalizeStickerEntry)
            .filter(Boolean);
    }

    function createEditorState(input) {
        const payload = input || {};

        return {
            version: 1,
            weaponId: payload.weaponId == null ? null : String(payload.weaponId),
            paintId: payload.paintId == null ? null : String(payload.paintId),
            wear: clampNumber(payload.wear, 0, 1, 0.000001),
            seed: clampInteger(payload.seed, 1, 1000, 1),
            stickers: normalizeStickers(payload.stickers)
        };
    }

    function getEditorStatePayload(fallbackState) {
        const base = createEditorState(fallbackState);

        if (!window.skinEditor3D || typeof window.skinEditor3D.getState !== 'function') {
            return base;
        }

        const runtimeState = window.skinEditor3D.getState() || {};
        return createEditorState({
            ...base,
            ...runtimeState,
            stickers: runtimeState.stickers || base.stickers
        });
    }

    window.renderer3dContract = {
        MAX_STICKER_SLOTS,
        createEditorState,
        getEditorStatePayload
    };
})();
