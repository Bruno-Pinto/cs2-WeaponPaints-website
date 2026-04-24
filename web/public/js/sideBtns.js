const socket = window.socket

const getWeaponDefindex = (weaponId) => weaponIds[weaponId] || weaponId

let skinsTemp = await fetch(`/js/json/skins/${lang}-skins.json`)
let defaultsTemp = await fetch(`/js/json/defaults/${lang}-defaults.json`)
let agentsTemp = await fetch(`/js/json/skins/agents.json`)
let musicTemp = await fetch(`/js/json/skins/music_kits.json`)

window.skinsObject = await skinsTemp.json()
window.defaultsObject = await defaultsTemp.json()
window.agentsObject = await agentsTemp.json()
window.musicObject = await musicTemp.json()

const sideBtnHandler = (activeBtn) => {
    // remove active background
    let allBtns = [
        'sideBtnKnives',
        'sideBtnGloves',
        'sideBtnPistols',
        'sideBtnRifles',
        'sideBtnPPs',
        'sideBtnShotguns',
        'sideBtnUtility',
        'sideBtnCTAgents',
        'sideBtnTAgents',
        'sideBtnMusic'
    ]

    allBtns.forEach(element => {
        let elms = document.querySelectorAll(`[id='${element}']`);
 
        for(var i = 0; i < elms.length; i++) 
            elms[i].classList.remove('active-side')
    });
    document.getElementById('sideBtnKnives').classList.remove('active-side')
    document.getElementById('sideBtnGloves').classList.remove('active-side')
    document.getElementById('sideBtnPistols').classList.remove('active-side')
    document.getElementById('sideBtnRifles').classList.remove('active-side')
    document.getElementById('sideBtnPPs').classList.remove('active-side')
    document.getElementById('sideBtnShotguns').classList.remove('active-side')
    document.getElementById('sideBtnUtility').classList.remove('active-side')
    document.getElementById('sideBtnMusic').classList.remove('active-side')

    
    // add active background
    let elms = document.querySelectorAll(`[id='${activeBtn}']`);
 
    for(var i = 0; i < elms.length; i++) 
        elms[i].classList.add('active-side') 
}

const showDefaults = (type) => {
    // clear main container
    document.getElementById('skinsContainer').innerHTML = ''

    if (type == 'sfui_invpanel_filter_melee') {
        document.getElementById('skinsContainer').setAttribute('data-category', 'knives');
        defaultsObject.forEach(knife => {
            if (knife.weapon_type == 'sfui_invpanel_filter_melee') {
                const matchingItems = getAllSelectedForItem(selectedKnives, {knife: knife.weapon_name});

                if (matchingItems.length > 0) {
                    changeKnifeSkinTemplate(knife, langObject, selectedKnife, matchingItems)
                    const skinWeapon = selectedSkins.find(element => element.weapon_defindex == weaponIds[knife.weapon_name]);
                    if (typeof skinWeapon != 'undefined') {
                        changeSkinCard(knife, skinWeapon)
                    }
                } else {
                    knivesTemplate(knife, langObject, selectedKnife)
                }    
                
            }
        })
    } else if (type == 'sfui_invpanel_filter_gloves') {
        document.getElementById('skinsContainer').setAttribute('data-category', 'gloves');
        defaultsObject.forEach(glove => {
            if (glove.weapon_type == 'sfui_invpanel_filter_gloves') {
                const matchingItems = getAllSelectedForItem(selectedGloves, {weapon_defindex: weaponIds[glove.weapon_name]});
                const matchingSkins = getAllSelectedForItem(selectedSkins, {weapon_defindex: weaponIds[glove.weapon_name]});
                const skinToShow = matchingSkins.length > 0 ? matchingSkins[0] : null;

                if (matchingItems.length > 0) {
                    changeGlovesSkinTemplate(glove, langObject, selectedGloves, matchingItems)
                } else {
                    glovesTemplate(glove, langObject, selectedGloves)
                }    
                if (skinToShow) {
                    changeSkinCard(glove, skinToShow)
                }
                
            }
        })
    } else {
        const categoryMap = {
            'csgo_inventory_weapon_category_pistols': 'pistols',
            'csgo_inventory_weapon_category_rifles': 'rifles',
            'csgo_inventory_weapon_category_smgs': 'pps',
            'csgo_inventory_weapon_category_heavy': 'shotguns',
            'csgo_inventory_weapon_category_utility': 'utility'
        };
        document.getElementById('skinsContainer').setAttribute('data-category', categoryMap[type] || 'other');

        defaultsObject.forEach(weapon => {
            if (weapon.weapon_type == type) {
                const matchingSkins = getAllSelectedForItem(selectedSkins, {
                    weapon_defindex: weaponIds[weapon.weapon_name]
                });

                const ctSkin = matchingSkins.find(match => match.weapon_team == 3) || null;
                const tSkin = matchingSkins.find(match => match.weapon_team == 2) || null;
                const primarySkin = ctSkin || tSkin;
                const secondarySkin = ctSkin && tSkin && ctSkin.weapon_paint_id != tSkin.weapon_paint_id ? tSkin : null;

                if (primarySkin) {
                    changeSkinTemplate(weapon, langObject, selectedKnife, '')
                    changeSkinCard(weapon, primarySkin, secondarySkin)
                } else {
                    defaultsTemplate(weapon, langObject, lang)
                }        
            }
        })
    }
}

const showKnives = () => {
    window.trackCategory('showKnives')
    sideBtnHandler('sideBtnKnives')
    showDefaults('sfui_invpanel_filter_melee')
}

const showGloves = () => {
    window.trackCategory('showGloves')
    sideBtnHandler('sideBtnGloves')
    showDefaults('sfui_invpanel_filter_gloves')
}

const showPistols = () => {
    window.trackCategory('showPistols')
    sideBtnHandler('sideBtnPistols')
    showDefaults('csgo_inventory_weapon_category_pistols')
}

const showRifles = () => {
    window.trackCategory('showRifles')
    sideBtnHandler('sideBtnRifles')
    showDefaults('csgo_inventory_weapon_category_rifles')
}

const showSniperRifles = () => {
    window.trackCategory('showSniperRifles')
    sideBtnHandler('sideBtnSniperRifles')
    showDefaults('csgo_inventory_weapon_category_rifles')
}

const showPPs = () => {
    window.trackCategory('showPPs')
    sideBtnHandler('sideBtnPPs')
    showDefaults('csgo_inventory_weapon_category_smgs')
}
    

const showShotguns = () => {
    window.trackCategory('showShotguns')
    sideBtnHandler('sideBtnShotguns')
    showDefaults('csgo_inventory_weapon_category_heavy')
}

const showP = () => {
    window.trackCategory('showP')
    sideBtnHandler('sideBtnP')
    showDefaults('csgo_inventory_weapon_category_heavy')
}

const showUtility = () => {
    window.trackCategory('showUtility')
    sideBtnHandler('sideBtnUtility')
    showDefaults('csgo_inventory_weapon_category_utility')
}

const showCTAgents = () => {
    window.trackCategory('showCTAgents')
    sideBtnHandler('sideBtnCTAgents')
    showAgents('ct')
}

const showTAgents = () => {
    window.trackCategory('showTAgents')
    sideBtnHandler('sideBtnTAgents')
    showAgents('t')
}

const showMusic = () => {
    sideBtnHandler('sideBtnMusic')
    showMusicKits()
}

window.showKnives = showKnives
window.showGloves = showGloves
window.showPistols = showPistols
window.showRifles = showRifles
window.showSniperRifles = showSniperRifles
window.showPPs = showPPs
window.showShotguns = showShotguns
window.showP = showP
window.showUtility = showUtility
window.showCTAgents = showCTAgents
window.showTAgents = showTAgents
window.showMusic = showMusic

const sideBtns = document.querySelectorAll('[data-type="sideBtn"]')
sideBtns.forEach(btn => {
    let attribute = btn.getAttribute('data-btn-type')
    switch (attribute) {
        case 'knives':
            btn.addEventListener('click', showKnives)
            break;
        case 'gloves':
            btn.addEventListener('click', showGloves)
            break;
        case 'pistols':
            btn.addEventListener('click', showPistols)
            break;
        case 'rifles':
            btn.addEventListener('click', showRifles)
            break;
        case 'smgs':
            btn.addEventListener('click', showPPs)
            break;
        case 'heavy':
            btn.addEventListener('click', showP)
            break;
        case 'utlility':
            btn.addEventListener('click', showUtility)
            break;
        case 'ctAgents':
            btn.addEventListener('click', showCTAgents)
            break;
        case 'tAgents':
            btn.addEventListener('click', showTAgents)
            break;
        case 'music':
            btn.addEventListener('click', showMusic)
            break;
        default:
            break;
    }
})

window.changeKnife = (weaponid, team = 'both') => {
    socket.emit('change-knife', {weaponid: weaponid, steamUserId: user.id, team: team})
    document.getElementById(`loading-${weaponid}`).style.visibility = 'visible'
    document.getElementById(`loading-${weaponid}`).style.opacity = 1
}

window.changeGlove = (weaponid, team = 'both') => {
    socket.emit('change-glove', {weaponid: weaponIds[weaponid], steamUserId: user.id, team: team})
    document.getElementById(`loading-${weaponid}`).style.visibility = 'visible'
    document.getElementById(`loading-${weaponid}`).style.opacity = 1
}

window.changeSkin = (steamid, weaponid, paintid, team = 'both') => {
    socket.emit('change-skin', {steamid: steamid, weaponid: weaponid, paintid: paintid, team: team})
    document.getElementById(`loading-${weaponid}-${paintid}`).style.visibility = 'visible'
    document.getElementById(`loading-${weaponid}-${paintid}`).style.opacity = 1
}

window.changeAgent = (steamid, model, team) => {
    console.log(steamid, model, team)
    socket.emit('change-agent', {steamid: steamid, model: model, team: team})
    document.getElementById(`loading-${model}`).style.visibility = 'visible'
    document.getElementById(`loading-${model}`).style.opacity = 1
}

window.changeMusic = (steamid, id, team = 'both') => {
    console.log(steamid, id)
    socket.emit('change-music', {steamid: steamid, id: id, team: team})
    document.getElementById(`loading-${id}`).style.visibility = 'visible'
    document.getElementById(`loading-${id}`).style.opacity = 1
}

window.resetSkin = (weaponid, steamid, team = 'both') => {
    console.log(steamid, weaponid)
    socket.emit('reset-skin', {steamid: steamid || user.id, weaponid: weaponid, team: team})
}

window.unequipSkin = (weaponid, steamid, paintid) => {
    // Find which teams have this skin selected
    const matchingSkins = selectedSkins.filter(element => {
        return element.weapon_defindex == weaponid && element.weapon_paint_id == paintid;
    });

    if (matchingSkins.length === 0) {
        return;
    }

    const teams = new Set(matchingSkins.map(skin => skin.weapon_team));
    let team = 'both';

    if (teams.size === 1) {
        if (teams.has(2)) {
            team = 't';
        } else if (teams.has(3)) {
            team = 'ct';
        }
    }

    resetSkin(weaponid, steamid, team);
}


socket.on('skin-reset', data => {
    const teamMap = { 'both': [2, 3], 'ct': [3], 't': [2] };
    const teamsToClear = teamMap[data.team || 'both'] || [2, 3];

    selectedSkins = selectedSkins.filter(element => {
        return element.weapon_defindex != data.weaponid || !teamsToClear.includes(element.weapon_team);
    })

    refreshCurrentCategory()
})

socket.on('knife-changed', data => {
    selectedKnives = data.knives
    selectedKnife.knife = data.knife

    refreshCurrentCategory()

    const loadingElement = document.getElementById(`loading-${data.knife}`)
    if (loadingElement) {
        loadingElement.style.opacity = 0
        loadingElement.style.visibility = 'hidden'
    }
})

socket.on('glove-changed', data => {
    selectedGloves = data.gloves

    refreshCurrentCategory()

    const gloves = getKeyByValue(weaponIds, data.weaponid)
    const loadingElement = document.getElementById(`loading-${gloves}`)
    if (loadingElement) {
        loadingElement.style.opacity = 0
        loadingElement.style.visibility = 'hidden'
    }
})

socket.on('skin-changed', data => {
    selectedSkins = data.newSkins

    refreshCurrentCategory()

    const loadingElement = document.getElementById(`loading-${data.weaponid}-${data.paintid}`)
    if (loadingElement) {
        loadingElement.style.opacity = 0
        loadingElement.style.visibility = 'hidden'
    }
})

socket.on('agent-changed', data => {
    selectedAgents = data.agents

    refreshCurrentCategory()

    const loadingElement = document.getElementById(`loading-${data.currentAgent}`)
    if (loadingElement) {
        loadingElement.style.opacity = 0
        loadingElement.style.visibility = 'hidden'
    }
})

socket.on('music-changed', data => {
    selectedMusic = data.music

    refreshCurrentCategory()

    const loadingElement = document.getElementById(`loading-${data.currentMusic}`)
    if (loadingElement) {
    window.trackCategory('knifeSkins')
        loadingElement.style.opacity = 0
        loadingElement.style.visibility = 'hidden'
    }
})

window.knifeSkins = (knifeType) => {
    // clear main container
    document.getElementById('skinsContainer').innerHTML = ''
    document.getElementById('skinsContainer').setAttribute('data-category', 'skins');
    window.currentSkinWeaponType = knifeType

    skinsObject.forEach(element => {
        if (getWeaponDefindex(element.weapon.id) == getWeaponDefindex(knifeType)) {
            let rarities = {
                "#b0c3d9": "common",
                "#5e98d9": "uncommon",
                "#4b69ff": "rare",
                "#8847ff": "mythical",
                "#d32ce6": "legendary",
                "#eb4b4b": "ancient",
                "#e4ae39": "contraband"
            }

            let bgColor = 'card-uncommon'
            let phase  = ''
            let active = ''
            let steamid = user.id
            let weaponid = getWeaponDefindex(element.weapon.id)
            let paintid = element.paint_index

            // Get color of item for card
            if (element.category.id == 'sfui_invpanel_filter_melee') { 
                // Gold if knife
                bgColor = 'card-gold'
            } else {
                // Anything else
                bgColor = `card-${rarities[element.rarity.color]}`
            }

            // Phase for Dopplers
            if (typeof element.phase != 'undefined') {
                phase = `(${element.phase})`
            }

            // Check if skin is selected for current team
            const matchingSkins = getAllSelectedForItem(selectedSkins, {
                weapon_paint_id: element.paint_index,
                weapon_defindex: getWeaponDefindex(element.weapon.id)
            });

            if (matchingSkins.length > 0) {
                active = 'active-card'
            }

            // Always show team badges when a skin is selected
            let teamBadges = '';
            if (matchingSkins.length > 0) {
                teamBadges = getTeamBadgeForMatches(matchingSkins);
            }

            let card = document.createElement('div')
            card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

            card.innerHTML = `
                <div id="weapon-${weaponid}-${element.paint_index}" class="weapon-card rounded-3 d-flex flex-column ${active} ${bgColor} contrast-reset pb-2 position-relative" data-type="skinCard" data-btn-type="${weaponid}-${element.paint_index}">
                    ${teamBadges}
                    <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${weaponid}-${element.paint_index}">
                        <div class="spinner-border spinner-border-xl" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>

                    <button onclick="editModal(\'${element.image}\', \'${element.weapon.name}\', \'${element.pattern.name} ${phase}\', \'${element.weapon.id}\' , \'${element.paint_index}\')" style="z-index: 3;" class="settings d-flex justify-content-center align-items-center bg-light text-dark rounded-circle" data-bs-toggle="modal" data-bs-target="#patternFloat">
                        <i class="fa-solid fa-gear"></i>
                    </button>

                    <img src="${element.image}" class="weapon-img mx-auto my-3" loading="lazy" width="181px" height="136px" alt="${element.name}">
                    
                    <div class="d-flex align-items-center g-3">
                        <p class="m-0 ms-3 text-secondary">
                            <small class="text-roboto">
                                ${element.weapon.name}
                            </small>
                        </p>
                        <div class="skin-dot mx-2"></div>
                    </div>
                    
                    <h5 class="weapon-skin-title text-roboto ms-3">
                        ${element.pattern.name} ${phase}
                    </h5>

                    <div class="d-flex gap-2 px-3 mt-auto">
                        <button class="btn btn-sm btn-outline-light w-100" onclick="unequipSkin(${weaponid}, '${user.id}', ${element.paint_index})">Unequip</button>
                    </div>
                    <div class="d-flex gap-2 px-3 mt-2">
                        <button class="btn btn-sm btn-primary w-100" onclick="changeSkin('${user.id}', '${weaponid}', ${element.paint_index}, 't')">Equip T</button>
                        <button class="btn btn-sm btn-primary w-100" onclick="changeSkin('${user.id}', '${weaponid}', ${element.paint_index}, 'ct')">Equip CT</button>
                        <button class="btn btn-sm btn-warning w-100" onclick="changeSkin('${user.id}', '${weaponid}', ${element.paint_index}, 'both')">Both</button>
                    </div>
                </div>
            `

            document.getElementById('skinsContainer').appendChild(card)
        }
        
    });
}