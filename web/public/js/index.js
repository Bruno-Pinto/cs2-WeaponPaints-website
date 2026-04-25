window.socket = io()
const socket = window.socket

let currentWeaponId = ''
let currentPaintId = ''
window.currentSkinWeaponType = ''
window.selectedTeam = 'both'
window.lastNonBothTeam = 'ct'
window.previousCategory = null
window.featureFlags = (window.appConfig && window.appConfig.features) || {}
window.skinEditor3D = null
window.stickerEditor = null

const is3dEditorEnabled = () => Boolean(window.featureFlags.editor3d)
const is3dStickerEditorEnabled = () => Boolean(window.featureFlags.editor3d && window.featureFlags.editor3dStickers)

const getCurrentStickerState = (weaponId, paintId) => {
    const resolvedWeaponId = weaponIds[weaponId] || weaponId

    if (typeof selectedSkins === 'undefined' || !Array.isArray(selectedSkins)) {
        return []
    }

    const matchingSkins = selectedSkins.filter((skin) => {
        return skin.weapon_defindex == resolvedWeaponId && skin.weapon_paint_id == paintId
    })

    if (!matchingSkins.length) {
        return []
    }

    const selectedTeams = resolveSelectedTeams(window.selectedTeam)
    const teamSkin = matchingSkins.find((skin) => selectedTeams.includes(skin.weapon_team)) || matchingSkins[0]
    return Array.isArray(teamSkin.sticker_data) ? teamSkin.sticker_data : []
}

const mountOrUpdate3DEditor = (state) => {
    if (!is3dEditorEnabled()) {
        return
    }

    const canvasHost = document.getElementById('editor3dCanvas')
    if (!canvasHost || !window.createSkinRenderer3D || !window.renderer3dContract) {
        return
    }

    if (!window.skinEditor3D) {
        window.skinEditor3D = window.createSkinRenderer3D({
            container: canvasHost
        })
    }

    if (!window.skinEditor3D) {
        return
    }

    const normalizedState = window.renderer3dContract.createEditorState(state)

    if (typeof window.skinEditor3D.mount === 'function' && !window.skinEditor3D.mountReady) {
        window.skinEditor3D.mount(normalizedState)
        return
    }

    if (typeof window.skinEditor3D.updateState === 'function') {
        window.skinEditor3D.updateState(normalizedState)
    }
}

const unmount3DEditor = () => {
    if (!window.skinEditor3D) {
        return
    }

    if (typeof window.skinEditor3D.unmount === 'function') {
        window.skinEditor3D.unmount()
    }

    window.skinEditor3D = null
}

const getActiveStickers = () => {
    if (window.stickerEditor && typeof window.stickerEditor.getStickers === 'function') {
        return window.stickerEditor.getStickers()
    }

    return getCurrentStickerState(currentWeaponId, currentPaintId)
}

const mountOrUpdateStickerEditor = (stickers = []) => {
    const stickerHost = document.getElementById('stickerEditorHost')
    if (!stickerHost) {
        return
    }

    if (!is3dStickerEditorEnabled()) {
        stickerHost.style.display = 'none'
        return
    }

    stickerHost.style.display = 'block'

    if (!window.createStickerEditor) {
        return
    }

    if (!window.stickerEditor) {
        window.stickerEditor = window.createStickerEditor({
            container: stickerHost,
            onChange: (nextStickers) => {
                mountOrUpdate3DEditor({
                    weaponId: currentWeaponId,
                    paintId: currentPaintId,
                    wear: document.getElementById('float')?.value || '0.000001',
                    seed: document.getElementById('pattern')?.value || '1',
                    stickers: nextStickers
                })
            }
        })
    }

    if (window.stickerEditor && typeof window.stickerEditor.mount === 'function') {
        window.stickerEditor.mount(stickers)
    }
}

const unmountStickerEditor = () => {
    if (window.stickerEditor && typeof window.stickerEditor.destroy === 'function') {
        window.stickerEditor.destroy()
    }

    window.stickerEditor = null
}

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
        return getTeamBadge('both');
    }

    if (teams.has(2)) {
        return getTeamBadge('T');
    }

    if (teams.has(3)) {
        return getTeamBadge('CT');
    }

    return '';
}

function getFloatLabel(value) {
    const floatValue = Number(value);

    if (typeof langObject === 'undefined' || !Number.isFinite(floatValue) || !langObject.modal || !Array.isArray(langObject.modal.patternButtons)) {
        return '';
    }

    let index = 0;
    if (floatValue >= 0.45) {
        index = 4;
    } else if (floatValue >= 0.38) {
        index = 3;
    } else if (floatValue >= 0.15) {
        index = 2;
    } else if (floatValue >= 0.07) {
        index = 1;
    }

    return langObject.modal.patternButtons[index]?.longName || '';
}

function syncFloatInputs(value) {
    const floatSlider = document.getElementById('floatSlider');
    const floatInput = document.getElementById('float');
    const floatText = document.getElementById('floatText');
    const nextValue = value ?? '0.000001';

    if (floatSlider) {
        floatSlider.value = nextValue;
    }

    if (floatInput) {
        floatInput.value = nextValue;
    }

    if (floatText) {
        floatText.textContent = getFloatLabel(nextValue);
    }
}

window.setFloat = (value) => {
    syncFloatInputs(value);
}

function resetEditModal() {
    const form = document.getElementById('patternFloat');
    const modalButton = document.getElementById('modalButton');

    currentWeaponId = '';
    currentPaintId = '';

    syncFloatInputs('0.000001');
    const patternInput = document.getElementById('pattern');
    if (patternInput) {
        patternInput.value = '0';
    }

    if (modalButton && typeof langObject !== 'undefined') {
        modalButton.innerHTML = langObject.change;
    }

    const editor3dHost = document.getElementById('editor3dHost')
    if (editor3dHost) {
        editor3dHost.style.display = 'none'
    }

    const stickerEditorHost = document.getElementById('stickerEditorHost')
    if (stickerEditorHost) {
        stickerEditorHost.style.display = 'none'
    }

    unmountStickerEditor()
    unmount3DEditor()

    return form;
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

const resolveSelectedTeams = (team = window.selectedTeam) => {
    if (team === 'ct') {
        return [3];
    }

    if (team === 't') {
        return [2];
    }

    return [2, 3];
}

const getCurrentSkinParams = (weaponId, paintId) => {
    const resolvedWeaponId = weaponIds[weaponId] || weaponId
    const defaultValues = {
        floatValue: '0.000001',
        patternValue: '0'
    }

    if (typeof selectedSkins === 'undefined' || !Array.isArray(selectedSkins)) {
        return defaultValues
    }

    const matchingSkins = selectedSkins.filter((skin) => {
        return skin.weapon_defindex == resolvedWeaponId && skin.weapon_paint_id == paintId
    })

    if (!matchingSkins.length) {
        return defaultValues
    }

    const selectedTeams = resolveSelectedTeams(window.selectedTeam)
    let currentSkin = matchingSkins.find((skin) => selectedTeams.includes(skin.weapon_team))

    if (!currentSkin && window.selectedTeam === 'both') {
        const preferredTeam = window.lastNonBothTeam === 't' ? 2 : 3
        currentSkin = matchingSkins.find((skin) => skin.weapon_team == preferredTeam)
    }

    if (!currentSkin) {
        currentSkin = matchingSkins[0]
    }

    return {
        floatValue: String(currentSkin.weapon_wear ?? defaultValues.floatValue),
        patternValue: String(currentSkin.weapon_seed ?? defaultValues.patternValue)
    }
}

const applyCurrentParamsLocally = (payload) => {
    if (!payload || typeof selectedSkins === 'undefined' || !Array.isArray(selectedSkins)) {
        return
    }

    const teamsToUpdate = resolveSelectedTeams(payload.team)

    selectedSkins.forEach((skin) => {
        if (skin.weapon_defindex == payload.weaponid && skin.weapon_paint_id == payload.paintid && teamsToUpdate.includes(skin.weapon_team)) {
            skin.weapon_wear = payload.float
            skin.weapon_seed = payload.pattern
            if (payload.stickers || payload.editor3d?.stickers) {
                skin.sticker_data = payload.stickers || payload.editor3d.stickers
            }
        }
    })
}

const buildEditor3DPayload = (weaponid, paintid, float, pattern) => {
    if (!is3dEditorEnabled() || !window.renderer3dContract) {
        return null
    }

    const stickers = getActiveStickers()

    return window.renderer3dContract.getEditorStatePayload({
        weaponId: weaponid,
        paintId: paintid,
        wear: float,
        seed: pattern,
        stickers
    })
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
    "sfui_wpnhud_knifebayonet": 500,
    "sfui_wpnhud_knifecss": 503,
    "sfui_wpnhud_knifeflip": 505,
    "sfui_wpnhud_knifegut": 506,
    "sfui_wpnhud_knifekaram": 507,
    "sfui_wpnhud_knifem9": 508,
    "sfui_wpnhud_knifetactical": 509,
    "sfui_wpnhud_knife_css": 503,
    "sfui_wpnhud_knife_flip": 505,
    "sfui_wpnhud_knife_gut": 506,
    "sfui_wpnhud_knife_karambit": 507,
    "sfui_wpnhud_knife_m9_bayonet": 508,
    "sfui_wpnhud_knife_tactical": 509,
    "sfui_wpnhud_knife_falchion_advanced": 512,
    "sfui_wpnhud_knife_survival_bowie": 514,
    "sfui_wpnhud_knife_butterfly": 515,
    "sfui_wpnhud_knife_push": 516,
    "sfui_wpnhud_knife_cord": 517,
    "sfui_wpnhud_knife_canis": 518,
    "sfui_wpnhud_knife_ursus": 519,
    "sfui_wpnhud_knife_gypsy_jackknife": 520,
    "sfui_wpnhud_knife_outdoor": 521,
    "sfui_wpnhud_knife_stiletto": 522,
    "sfui_wpnhud_knife_widowmaker": 523,
    "sfui_wpnhud_knife_skeleton": 525,
    "sfui_wpnhud_knife_kukri": 526,
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
    currentWeaponId = weaponIds[weaponId] || weaponId
    currentPaintId = paintId
    const { floatValue, patternValue } = getCurrentSkinParams(weaponId, paintId)
    const stickers = getCurrentStickerState(weaponId, paintId)
    syncFloatInputs(floatValue)

    const patternInput = document.getElementById('pattern')
    if (patternInput) {
        patternInput.value = patternValue
    }

    const modalButton = document.getElementById('modalButton')
    if (modalButton && typeof langObject !== 'undefined') {
        modalButton.innerHTML = langObject.change
    }

    const editor3dHost = document.getElementById('editor3dHost')
    if (editor3dHost) {
        editor3dHost.style.display = is3dEditorEnabled() ? 'block' : 'none'
    }

    mountOrUpdateStickerEditor(stickers)

    mountOrUpdate3DEditor({
        weaponId: currentWeaponId,
        paintId: currentPaintId,
        wear: floatValue,
        seed: patternValue,
        stickers
    })

    console.log(img, weaponName, paintName, currentWeaponId, currentPaintId)
}

const changeParams = () => {
    let steamid = user.id
    let weaponid = currentWeaponId
    let paintid = currentPaintId
    let float = document.getElementById("float").value || '0.000001'
    let pattern = document.getElementById("pattern").value || '1'
    const team = window.selectedTeam || 'both'
    const editor3d = buildEditor3DPayload(weaponid, paintid, float, pattern)

    window.pendingParamUpdate = {
        weaponid,
        paintid,
        float,
        pattern,
        team,
        editor3d,
        stickers: editor3d ? editor3d.stickers : []
    }

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
        team,
        editor3d,
        stickers: editor3d ? editor3d.stickers : []
    })
}

socket.on('params-changed', (serverPayload = {}) => {
    const pending = window.pendingParamUpdate || {}
    const normalizedPayload = {
        ...pending,
        float: serverPayload.float ?? pending.float,
        pattern: serverPayload.pattern ?? pending.pattern,
        editor3d: serverPayload.editor3d || pending.editor3d,
        stickers: serverPayload.stickers || pending.stickers
    }

    applyCurrentParamsLocally(normalizedPayload)
    window.pendingParamUpdate = null
    document.getElementById('modalButton').innerHTML = langObject.change
    const modalElement = document.getElementById('patternFloat')
    if (modalElement && window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement)
        modal.hide()
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove())
            document.body.classList.remove('modal-open')
            document.body.style.removeProperty('padding-right')
        }, 200)
    }
    showSuccessNotification()
    resetEditModal()
})

const floatSlider = document.getElementById('floatSlider')
const floatInput = document.getElementById('float')
if (floatSlider && floatInput) {
    floatSlider.addEventListener('input', (event) => {
        syncFloatInputs(event.target.value)
        mountOrUpdate3DEditor({
            weaponId: currentWeaponId,
            paintId: currentPaintId,
            wear: event.target.value,
            seed: document.getElementById('pattern')?.value || '1',
            stickers: buildEditor3DPayload(currentWeaponId, currentPaintId, event.target.value, document.getElementById('pattern')?.value || '1')?.stickers || []
        })
    })

    floatInput.addEventListener('input', (event) => {
        syncFloatInputs(event.target.value)
        mountOrUpdate3DEditor({
            weaponId: currentWeaponId,
            paintId: currentPaintId,
            wear: event.target.value,
            seed: document.getElementById('pattern')?.value || '1',
            stickers: buildEditor3DPayload(currentWeaponId, currentPaintId, event.target.value, document.getElementById('pattern')?.value || '1')?.stickers || []
        })
    })

    const patternInput = document.getElementById('pattern')
    if (patternInput) {
        patternInput.addEventListener('input', (event) => {
            mountOrUpdate3DEditor({
                weaponId: currentWeaponId,
                paintId: currentPaintId,
                wear: document.getElementById('float')?.value || '0.000001',
                seed: event.target.value || '1',
                stickers: getActiveStickers()
            })
        })
    }

    syncFloatInputs(floatInput.value || floatSlider.value)
}

const editModalElement = document.getElementById('patternFloat')
if (editModalElement) {
    editModalElement.addEventListener('hidden.bs.modal', () => {
        unmountStickerEditor()
        unmount3DEditor()
        resetEditModal()
    })
}

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
