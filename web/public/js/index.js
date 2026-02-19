window.socket = io()
const socket = window.socket

let currentWeaponId = ''
let currentPaintId = ''
window.currentSkinWeaponType = ''
window.selectedTeam = 'both'
window.previousCategory = null

window.goBack = () => {
    if (window.previousCategory && typeof window[window.previousCategory] === 'function') {
        window[window.previousCategory]();
    }
}

window.showBackButton = (show = true) => {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.style.display = show ? '' : 'none';
    }
}

window.trackCategory = (categoryName) => {
    window.previousCategory = categoryName;
    window.showBackButton(categoryName !== null);
}

// Refresh current view to apply filter
function refreshCurrentCategory() {
    const currentCategory = document.getElementById('skinsContainer').getAttribute('data-category');
    if (!currentCategory) {
        return;
    }

    switch(currentCategory) {
        case 'knives': showKnives(); break;
        case 'gloves': showGloves(); break;
        case 'pistols': showPistols(); break;
        case 'rifles': showRifles(); break;
        case 'pps': showPPs(); break;
        case 'shotguns': showShotguns(); break;
        case 'utility': showUtility(); break;
        case 'ct-agents': showCTAgents(); break;
        case 't-agents': showTAgents(); break;
        case 'music': showMusic(); break;
        case 'skins':
            if (window.currentSkinWeaponType) {
                knifeSkins(window.currentSkinWeaponType);
            }
            break;
    }
}

window.refreshCurrentCategory = refreshCurrentCategory

// Team filter management
function setTeamFilter(team) {
    window.selectedTeam = team;
    if (team !== 'both') {
        window.lastNonBothTeam = team;
    }

    // Update button states
    const bothButton = document.getElementById('teamBoth');
    if (bothButton) {
        bothButton.className = team === 'both' ? 'btn btn-primary active' : 'btn btn-outline-primary';
    }
    document.getElementById('teamCT').className = team === 'ct' ? 'btn btn-primary active' : 'btn btn-outline-primary';
    document.getElementById('teamT').className = team === 't' ? 'btn btn-primary active' : 'btn btn-outline-primary';

    refreshCurrentCategory();
}

// Helper to get team badge HTML
function getTeamBadge(label) {
    if (!label) {
        return '';
    }

    let badgeClass = 'bg-secondary text-light';
    if (label === 'T') {
        badgeClass = 'bg-warning text-dark';
    } else if (label === 'CT') {
        badgeClass = 'bg-info text-dark';
    }

    return `<span class="badge ${badgeClass} position-absolute top-0 start-0 m-2" style="z-index: 10;">${label}</span>`;
}

// Helper to build a single badge for all matches
function getTeamBadgeForMatches(matches) {
    if (!matches || matches.length === 0) {
        return '';
    }

    const teams = new Set(matches.map(match => match.weapon_team));
    if (teams.has(2) && teams.has(3)) {
        return getTeamBadge('Both');
    }

    if (teams.has(2)) {
        return getTeamBadge('T');
    }

    if (teams.has(3)) {
        return getTeamBadge('CT');
    }

    return '';
}

// Helper to check if item is selected for current team
function isSelectedForTeam(items, matchCriteria) {
    if (!items || !Array.isArray(items)) return null;

    const teamMap = { 'both': [2, 3], 'ct': [3], 't': [2] };
    const teamsToCheck = teamMap[window.selectedTeam] || [2, 3];

    const matches = items.filter(item => {
        const criteriaMatch = Object.keys(matchCriteria).every(key => item[key] == matchCriteria[key]);
        return criteriaMatch && teamsToCheck.includes(item.weapon_team);
    });

    return matches.length > 0 ? matches : null;
}

// Helper to get all selected items (for showing badges in "both" mode)
function getAllSelectedForItem(items, matchCriteria) {
    if (!items || !Array.isArray(items)) return [];

    return items.filter(item => {
        return Object.keys(matchCriteria).every(key => item[key] == matchCriteria[key]);
    });
}


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

const weaponIds = {
    "weapon_deagle": 1,
    "weapon_elite": 2,
    "weapon_fiveseven": 3,
    "weapon_glock": 4,
    "weapon_ak47": 7,
    "weapon_aug": 8,
    "weapon_awp": 9,
    "weapon_famas": 10,
    "weapon_g3sg1": 11,
    "weapon_galilar": 13,
    "weapon_m249": 14,
    "weapon_m4a1": 16,
    "weapon_mac10": 17,
    "weapon_p90": 19,
    "weapon_mp5sd": 23,
    "weapon_ump45": 24,
    "weapon_xm1014": 25,
    "weapon_bizon": 26,
    "weapon_mag7": 27,
    "weapon_negev": 28,
    "weapon_sawedoff": 29,
    "weapon_tec9": 30,
    "weapon_taser": 31,
    "weapon_hkp2000": 32,
    "weapon_mp7": 33,
    "weapon_mp9": 34,
    "weapon_nova": 35,
    "weapon_p250": 36,
    "weapon_shield": 37,
    "weapon_scar20": 38,
    "weapon_sg556": 39,
    "weapon_ssg08": 40,
    "weapon_knifegg": 41,
    "weapon_knife": 42,
    "weapon_flashbang": 43,
    "weapon_hegrenade": 44,
    "weapon_smokegrenade": 45,
    "weapon_molotov": 46,
    "weapon_decoy": 47,
    "weapon_incgrenade": 48,
    "weapon_c4": 49,
    "weapon_healthshot": 57,
    "weapon_knife_t": 59,
    "weapon_m4a1_silencer": 60,
    "weapon_usp_silencer": 61,
    "weapon_cz75a": 63,
    "weapon_revolver": 64,
    "weapon_tagrenade": 68,
    "weapon_fists": 69,
    "weapon_breachcharge": 70,
    "weapon_tablet": 72,
    "weapon_melee": 74,
    "weapon_axe": 75,
    "weapon_hammer": 76,
    "weapon_spanner": 78,
    "weapon_knife_ghost": 80,
    "weapon_firebomb": 81,
    "weapon_diversion": 82,
    "weapon_frag_grenade": 83,
    "weapon_snowball": 84,
    "weapon_bumpmine": 85,
    "weapon_bayonet": 500,
    "weapon_knife_css": 503,
    "weapon_knife_flip": 505,
    "weapon_knife_gut": 506,
    "weapon_knife_karambit": 507,
    "weapon_knife_m9_bayonet": 508,
    "weapon_knife_tactical": 509,
    "weapon_knife_falchion": 512,
    "weapon_knife_survival_bowie": 514,
    "weapon_knife_butterfly": 515,
    "weapon_knife_push": 516,
    "weapon_knife_cord": 517,
    "weapon_knife_canis": 518,
    "weapon_knife_ursus": 519,
    "weapon_knife_gypsy_jackknife": 520,
    "weapon_knife_outdoor": 521,
    "weapon_knife_stiletto": 522,
    "weapon_knife_widowmaker": 523,
    "weapon_knife_skeleton": 525,
    "weapon_knife_kukri": 526,
    "studded_brokenfang_gloves": 4725,
    "studded_bloodhound_gloves": 5027,
    "t_gloves": 5028,
    "ct_gloves": 5029,
    "sporty_gloves": 5030,
    "slick_gloves": 5031,
    "leather_handwraps": 5032,
    "motorcycle_gloves": 5033,
    "specialist_gloves": 5034,
    "studded_hydra_gloves": 5035
}

const editModal = (img, weaponName, paintName, weaponId, paintId) => {
    document.getElementById('modalImg').src = img
    document.getElementById('modalWeapon').innerText = weaponName
    document.getElementById('modalPaint').innerText = paintName
    currentWeaponId = weaponIds[weaponId]
    currentPaintId = paintId
    console.log(img, weaponName, paintName, currentWeaponId, currentPaintId)
}

const changeParams = () => {
    let steamid = user.id
    let weaponid = currentWeaponId
    let paintid = currentPaintId
    let float = document.getElementById("float").value
    let pattern = document.getElementById("pattern").value

    document.getElementById('modalButton').innerHTML = 
        `
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `

    socket.emit('change-params', {
        steamid: steamid,
        weaponid: weaponid,
        paintid: paintid,
        float: float,
        pattern: pattern,
        team: window.selectedTeam
    })
}

socket.on('params-changed', () => {
    document.getElementById('modalButton').innerHTML = langObject.change
    const modal = bootstrap.Modal.getInstance(document.getElementById('patternFloat'))
    if (modal) {
        modal.hide()
    }
    showSuccessNotification()
})

const showSuccessNotification = () => {
    const notification = document.getElementById('successNotification')
    if (notification) {
        notification.style.display = 'block'
        notification.style.opacity = '1'
        setTimeout(() => {
            notification.style.opacity = '0'
            setTimeout(() => {
                notification.style.display = 'none'
            }, 300)
        }, 2000)
    }
}
