# Team-Specific Skins Support Implementation

## Overview
This implementation adds CT/T team-specific weapon skins support to the WeaponPaints website, compatible with the WeaponPaints database schema using `weapon_team` column.

## Database Schema
The implementation uses the existing `weapon_team` column in WeaponPaints tables:
- `weapon_team = 2` → Terrorist (T)
- `weapon_team = 3` → Counter-Terrorist (CT)
- When "Both" is selected, the system writes TWO rows (one for each team)

## Files Modified

### Backend Changes

#### 1. `src/listeners/weapon.listener.js`
**Major refactor** - All socket event handlers now support team-specific operations:

- Added `resolveTeams()` helper function to convert team string to weapon_team values
- Updated all functions to include `weapon_team` in SQL WHERE clauses:
  - `changeKnife()` - Saves knife selection per team
  - `changeGloves()` - Saves gloves selection per team
  - `changeSkin()` - Saves weapon skins per team
  - `changeAgent()` - Saves agents per team
  - `changeMusic()` - Saves music kits per team
  - `resetSkin()` - Resets skins per team
  - `changeParams()` - Updates float/pattern per team

**Key Pattern:**
```javascript
const teams = resolveTeams(data.team); // Returns [2, 3] for "both", [2] for "t", [3] for "ct"
for (const weaponTeam of teams) {
    // Check/Update/Insert with weapon_team in WHERE clause
}
```

#### 2. `src/utils/db.query.js`
Updated `getLoggedInUserInfo()` to:
- Return arrays for all weapon types (knives, skins, gloves, agents, music)
- Provide backward compatibility by also returning single `knife` object

### Frontend Changes

#### 3. `web/views/index.ejs`
- Added 3-button team selector UI (Both/CT/T) with icons
- Fixed duplicate `skinsContainer` div issue
- Updated script blocks to initialize arrays: `selectedKnives`, `selectedGloves`, `selectedAgents`, `selectedMusic`
- Maintains `selectedKnife` for backward compatibility

**Team Selector HTML:**
```html
<div class="btn-group" role="group">
    <button type="button" class="btn btn-primary active" id="teamBoth" onclick="setTeamFilter('both')">
        <i class="fa-solid fa-users"></i> Both Teams
    </button>
    <button type="button" class="btn btn-outline-primary" id="teamCT" onclick="setTeamFilter('ct')">
        <i class="fa-solid fa-shield"></i> CT
    </button>
    <button type="button" class="btn btn-outline-primary" id="teamT" onclick="setTeamFilter('t')">
        <i class="fa-solid fa-skull"></i> T
    </button>
</div>
```

#### 4. `web/public/js/index.js`
Added team management functionality:
- `selectedTeam` global variable (default: "both")
- `setTeamFilter(team)` - Switches between Both/CT/T and refreshes view
- `getTeamBadge(weaponTeam)` - Returns HTML for team badge
- `isSelectedForTeam(items, criteria)` - Filters items by current team
- `getAllSelectedForItem(items, criteria)` - Gets all team selections for badge display
- Updated `changeParams()` to include team in socket emit

#### 5. `web/public/js/sideBtns.js`
Updated all socket emit functions to include `team: selectedTeam`:
- `changeKnife()`
- `changeGlove()`
- `changeSkin()`
- `changeMusic()`
- `resetSkin()`

Updated `showDefaults()` to:
- Set `data-category` attribute on container (enables view refresh)
- Use `isSelectedForTeam()` for team-aware selection checks

Updated `knifeSkins()` to:
- Check selections with team filtering
- Add team badges to skin cards
- Make cards position-relative for badge positioning

#### 6. `web/public/js/templates.js`
Updated all template functions to support team badges:

**Templates Updated:**
- `knivesTemplate()` - Shows badges for selected knives
- `changeKnifeSkinTemplate()` - Shows badges on skin-customized knives
- `glovesTemplate()` - Shows badges for selected gloves
- `changeGlovesSkinTemplate()` - Shows badges on skin-customized gloves
- `showAgents()` - Team-aware agent selection with badges
- `showMusicKits()` - Team-aware music selection with badges

**Badge Implementation:**
```javascript
let teamBadges = '';
if (selectedTeam === 'both' && matchingItems && matchingItems.length > 0) {
    matchingItems.forEach(match => {
        teamBadges += getTeamBadge(match.weapon_team);
    });
}
```

## UI Behavior

### Team Selector
- **Both (Default)**: Shows all items; displays badges (T/CT) on selected items
- **CT**: Shows only CT-selected items as active
- **T**: Shows only T-selected items as active

### Team Badges
When "Both" is selected:
- Items selected for T show yellow "T" badge in top-right corner
- Items selected for CT show blue "CT" badge in top-right corner
- Items selected for both teams show both badges

When CT or T is selected:
- No badges shown (filter already applied)

### Save Operations
- **Both**: Saves to both `weapon_team=2` AND `weapon_team=3` (2 DB rows)
- **CT**: Saves only to `weapon_team=3` (1 DB row)
- **T**: Saves only to `weapon_team=2` (1 DB row)

### Reset Operations
- **Both**: Deletes both team rows
- **CT**: Deletes only CT row
- **T**: Deletes only T row

## Testing Checklist

✅ Set knife as CT only → join as CT (correct knife), join as T (default)
✅ Set knife as T only → join as T (correct knife), join as CT (default/previous)
✅ Set knife as Both → both teams get the same knife
✅ Set different skins for CT vs T → each team sees correct skin
✅ Change float/seed for CT only → doesn't affect T
✅ Reset CT only → resets CT, T unchanged
✅ Database rows have correct `weapon_team` values (2 or 3, NOT 0)
✅ Team selector buttons toggle correctly
✅ Badges display correctly in "Both" mode
✅ Agents work per team
✅ Music kits work per team
✅ Gloves work per team

## Database Migration Notes

**IMPORTANT**: If your existing database has `weapon_team = 0` rows, you'll need to migrate them:

```sql
-- Migrate existing data (run BEFORE using new code)
-- This duplicates all existing selections to both teams

-- For knives
INSERT INTO wp_player_knife (steamid, weapon_team, knife)
SELECT steamid, 2, knife FROM wp_player_knife WHERE weapon_team = 0;

INSERT INTO wp_player_knife (steamid, weapon_team, knife)
SELECT steamid, 3, knife FROM wp_player_knife WHERE weapon_team = 0;

DELETE FROM wp_player_knife WHERE weapon_team = 0;

-- Repeat for wp_player_gloves, wp_player_skins, wp_player_agents, wp_player_music
```

## Backward Compatibility

The implementation maintains backward compatibility:
- Old code expecting single objects still works (e.g., `selectedKnife`)
- Arrays are provided for new team-aware logic
- Socket events work with or without `team` parameter (defaults to "both")

## Future Enhancements

Possible improvements:
1. Bulk team operations (copy CT → T, swap teams)
2. Visual indicator showing which team you'll spawn as
3. Team-specific loadout presets
4. Import/export team configurations

## Credits

Implementation follows WeaponPaints database schema standards and maintains compatibility with the existing CS2 server-side plugin.

