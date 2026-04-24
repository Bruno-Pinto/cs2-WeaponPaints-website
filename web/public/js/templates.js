window.defaultsTemplate = (weapon, langObject, lang) => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card weapon_knife" id="${weapon.weapon_name}">
        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${weapon.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0;">
                <img src="${weapon.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${weapon.paint_name}">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${weapon.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${weapon.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)  
}

window.changeSkinTemplate = (weapon, langObject, selectedKnife, teamBadges = '') => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card weapon_knife position-relative" id="${weapon.weapon_name}">
        ${teamBadges}
        <button id="reset-${weapon.weapon_name}" onclick="resetSkin(${weapon.weapon_defindex}, '${selectedKnife.steamid}')" style="z-index: 3;" class="revert d-flex justify-content-center align-items-center text-danger rounded-circle">
            <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${weapon.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0;">
                <img src="${weapon.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${weapon.image}" id="img-${weapon.weapon_name}">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${weapon.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${weapon.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)  
}

window.changeKnifeSkinTemplate = (knife, langObject, selectedKnife, matchingItems) => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    // check if knife is selected
    let active = matchingItems && matchingItems.length > 0 ? 'active-card' : '';

    // Generate team badges
        let teamBadges = '';
        if (matchingItems && matchingItems.length > 0) {
            teamBadges = getTeamBadgeForMatches(matchingItems);
        }

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card ${active} weapon_knife position-relative" id="${knife.weapon_name}">
        ${teamBadges}
        <button id="reset-${knife.weapon_name}" onclick="resetSkin(${knife.weapon_defindex}, '${selectedKnife.steamid}')" style="z-index: 3;" class="revert d-flex justify-content-center align-items-center text-danger rounded-circle">
            <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${knife.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0;">
                <img src="${knife.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${knife.image}" id="img-${knife.weapon_name}">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${knife.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${knife.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
        <div class="d-flex gap-2 px-3 mb-2">
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeKnife('${knife.weapon_name}', 't')">Equip T</button>
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeKnife('${knife.weapon_name}', 'ct')">Equip CT</button>
            <button class="btn btn-sm btn-outline-warning w-100" onclick="changeKnife('${knife.weapon_name}', 'both')">Both</button>
        </div>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)  
}

window.changeSkinCard = (weapon, selectedSkin, secondarySkin = null) => {
    const findSkin = (skinRow) => {
        if (!skinRow) return null;
        return skinsObject.find(skinWeapon => {
            return weaponIds[skinWeapon.weapon.id] == weapon.weapon_defindex && skinWeapon.paint_index == skinRow.weapon_paint_id;
        }) || null;
    };

    const primarySkin = findSkin(selectedSkin);
    const secondary = secondarySkin ? findSkin(secondarySkin) : null;

    if (!primarySkin) {
        return;
    }

    if (primarySkin.category && primarySkin.category.id == 'sfui_invpanel_filter_melee') {
        primarySkin.rarity.color = "#caab05"
    }
    if (secondary && secondary.category && secondary.category.id == 'sfui_invpanel_filter_melee') {
        secondary.rarity.color = "#caab05"
    }

    const imgId = `img-${weapon.weapon_name}`;
    let existingImg = document.getElementById(imgId);
    const wrapperId = `img-wrap-${weapon.weapon_name}`;
    const existingWrapper = document.getElementById(wrapperId);

    if (secondary && weapon.weapon_type !== 'sfui_invpanel_filter_melee' && weapon.weapon_type !== 'sfui_invpanel_filter_gloves') {
        let wrapper = existingWrapper;

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = wrapperId;
            wrapper.className = existingImg ? existingImg.className : 'weapon-img mx-auto my-3';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'block';
            wrapper.style.aspectRatio = '181 / 136';
            wrapper.style.overflow = 'hidden';
        }

        // Left side: primary skin, right side: secondary skin
        wrapper.innerHTML = `
            <img data-skin-side="primary" src="${primarySkin.image}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; clip-path: inset(0 50% 0 0);" loading="lazy" alt="${primarySkin.pattern ? primarySkin.pattern.name : ''}">
            <img data-skin-side="secondary" src="${secondary.image}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; clip-path: inset(0 0 0 50%);" loading="lazy" alt="${secondary.pattern ? secondary.pattern.name : ''}">
        `;

        const primaryImg = wrapper.querySelector('[data-skin-side="primary"]');
        if (primaryImg) {
            primaryImg.style.filter = `drop-shadow(0px 0px 20px ${primarySkin.rarity.color})`;
        }

        const secondaryImg = wrapper.querySelector('[data-skin-side="secondary"]');
        if (secondaryImg) {
            secondaryImg.style.filter = `drop-shadow(0px 0px 20px ${secondary.rarity.color})`;
        }

        if (existingImg) {
            existingImg.replaceWith(wrapper);
        }
        return;
    }

    if (!existingImg && existingWrapper) {
        const newImg = document.createElement('img');
        newImg.id = imgId;
        newImg.className = existingWrapper.className || 'weapon-img mx-auto my-3';
        newImg.loading = 'lazy';
        newImg.alt = primarySkin.pattern ? primarySkin.pattern.name : '';
        existingWrapper.replaceWith(newImg);
        existingImg = newImg;
    }

    if (!existingImg) {
        return;
    }

    existingImg.src = primarySkin.image;
    existingImg.style = `filter: drop-shadow(0px 0px 20px ${primarySkin.rarity.color});`
}

window.knivesTemplate = (knife, langObject, selectedKnife) => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    // check if knife is selected for any team
    const allMatches = getAllSelectedForItem(selectedKnives, {knife: knife.weapon_name});
    let active = allMatches.length > 0 ? 'active-card' : '';

    // Generate team badges
        let teamBadges = '';
        if (allMatches.length > 0) {
            teamBadges = getTeamBadgeForMatches(allMatches);
        }

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card ${active} weapon_knife position-relative" id="${knife.weapon_name}">
        ${teamBadges}
        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${knife.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0;">
                <img src="${knife.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${knife.paint_name}">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${knife.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${knife.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
        <div class="d-flex gap-2 px-3 mb-2">
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeKnife('${knife.weapon_name}', 't')">Equip T</button>
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeKnife('${knife.weapon_name}', 'ct')">Equip CT</button>
            <button class="btn btn-sm btn-outline-warning w-100" onclick="changeKnife('${knife.weapon_name}', 'both')">Both</button>
        </div>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)      
}

window.glovesTemplate = (gloves, langObject, selectedGloves) => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    // check if gloves are selected for any team
    const allMatches = getAllSelectedForItem(selectedGloves, {weapon_defindex: gloves.weapon_defindex});
    let active = allMatches.length > 0 ? 'active-card' : '';

    // Generate team badges
        let teamBadges = '';
        if (allMatches.length > 0) {
            teamBadges = getTeamBadgeForMatches(allMatches);
        }

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card ${active} weapon_knife position-relative" id="${gloves.weapon_name}">
        ${teamBadges}
        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${gloves.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0; height: 196px;">
                <img src="${gloves.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${gloves.paint_name}" style="object-fit: contain; aspect-ratio: 512 / 384;">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${gloves.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${gloves.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
        <div class="d-flex gap-2 px-3 mb-2">
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeGlove('${gloves.weapon_name}', 't')">Equip T</button>
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeGlove('${gloves.weapon_name}', 'ct')">Equip CT</button>
            <button class="btn btn-sm btn-outline-warning w-100" onclick="changeGlove('${gloves.weapon_name}', 'both')">Both</button>
        </div>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)       
}

window.changeGlovesSkinTemplate = (gloves, langObject, selectedGloves, matchingItems) => {
    let card = document.createElement('div')
    card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

    const selectedGloveSteamid = selectedGloves?.steamid || selectedGloves?.[0]?.steamid || user.id

    // check if gloves are selected
    let active = matchingItems && matchingItems.length > 0 ? 'active-card' : '';

    // Generate team badges
    let teamBadges = '';
    if (matchingItems && matchingItems.length > 0) {
        teamBadges = getTeamBadgeForMatches(matchingItems);
    }

    card.innerHTML = `
    <div class="rounded-3 d-flex flex-column card-common weapon-card ${active} weapon_knife position-relative" id="${gloves.weapon_name}">
        ${teamBadges}
        <button id="reset-${gloves.weapon_name}" onclick="resetSkin(${gloves.weapon_defindex}, '${selectedGloveSteamid}')" style="z-index: 3;" class="revert d-flex justify-content-center align-items-center text-danger rounded-circle">
            <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${gloves.weapon_name}">
            <div class="spinner-border spinner-border-xl" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <a class="text-decoration-none d-flex flex-column" style="z-index: 0; height: 196px;">
                <img src="${gloves.image}" class="weapon-img mx-auto my-3" loading="lazy" alt="${gloves.image}" id="img-${gloves.weapon_name}" style="object-fit: contain;">
                
                <p class="m-0 text-light weapon-skin-title mx-auto text-center">${gloves.paint_name}</p>
        </a>
        <button onclick="knifeSkins(\'${gloves.weapon_name}\')" class="btn btn-primary text-warning mx-auto my-2" style="z-index: 1;"><small>${langObject.changeSkin}</small></button>
        <div class="d-flex gap-2 px-3 mb-2">
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeGlove('${gloves.weapon_name}', 't')">Equip T</button>
            <button class="btn btn-sm btn-outline-light w-100" onclick="changeGlove('${gloves.weapon_name}', 'ct')">Equip CT</button>
            <button class="btn btn-sm btn-outline-warning w-100" onclick="changeGlove('${gloves.weapon_name}', 'both')">Both</button>
        </div>
    </div>
    `

    document.getElementById('skinsContainer').appendChild(card)  
}

window.showAgents = (type) => {
    let team = {
        'ct': 3,
        't': 2
    }

    // clear main container
    document.getElementById('skinsContainer').innerHTML = ''
    document.getElementById('skinsContainer').setAttribute('data-category', type === 'ct' ? 'ct-agents' : 't-agents');

    agentsObject.forEach(element => {
        console.log(element.team, team.type)
        if (element.team == team[type]) {
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

            // Make outline if this skin is selected - check against current team filter
            const matchingAgents = isSelectedForTeam(selectedAgents, {});
            if (matchingAgents && matchingAgents.length > 0) {
                const agentColumn = type === 'ct' ? 'agent_ct' : 'agent_t';
                matchingAgents.forEach(match => {
                    if (match[agentColumn] == element.model) {
                        active = 'active-card';
                    }
                });
            }

            // Generate team badges
            let teamBadges = '';
            if (matchingAgents && matchingAgents.length > 0) {
                const agentColumn = type === 'ct' ? 'agent_ct' : 'agent_t';
                const matchesForAgent = matchingAgents.filter(match => match[agentColumn] == element.model);
                teamBadges = getTeamBadgeForMatches(matchesForAgent);
            }
            
            let card = document.createElement('div')
            card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

            card.innerHTML = `
                <div id="agent-${element.model}" class="weapon-card rounded-3 d-flex flex-column ${active} ${bgColor} contrast-reset pb-2 position-relative" data-type="skinCard" data-btn-type="">
                    ${teamBadges}
                    <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${element.model}">
                        <div class="spinner-border spinner-border-xl" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>

                    <img src="${element.image}" class="weapon-img mx-auto my-3" loading="lazy" width="181px" height="136px" alt=" ">
                    
                    <div class="d-flex align-items-center g-3">
                    
                    </div>
                    
                    <h5 class="weapon-skin-title text-roboto ms-3">
                        ${element.agent_name}
                    </h5>
                    <div class="d-flex gap-2 px-3 mt-auto">
                        <button class="btn btn-sm btn-primary w-100" onclick="changeAgent('${steamid}', '${element.model}', '${type}')">Equip</button>
                    </div>
                </div>
            `

            document.getElementById('skinsContainer').appendChild(card)
        }
    });
}

window.showMusicKits = () => {
    // clear main container
    document.getElementById('skinsContainer').innerHTML = ''
    document.getElementById('skinsContainer').setAttribute('data-category', 'music');

    musicObject.forEach(element => {
        console.log(element.id.slice(-2))
        if (element.id.slice(-2) != 'st') {
            let bgColor = 'card-uncommon'
            let active = ''
            let steamid = user.id
            let music_id = element.id.slice(element.id.lastIndexOf('-')+1)

            // Check if this music is selected for current team
            const matchingMusic = isSelectedForTeam(selectedMusic, {music_id: music_id});
            if (matchingMusic && matchingMusic.length > 0) {
                active = 'active-card'
            }
            
            // Generate team badges
            let teamBadges = '';
            if (matchingMusic && matchingMusic.length > 0) {
                teamBadges = getTeamBadgeForMatches(matchingMusic);
            }

            let card = document.createElement('div')
            card.classList.add('col-6', 'col-sm-4', 'col-md-3', 'p-2')

            card.innerHTML = `
                <div id="music-${music_id}" class="weapon-card card-rare rounded-3 d-flex flex-column ${active} ${bgColor} contrast-reset pb-2 position-relative" data-type="skinCard" data-btn-type="">
                    ${teamBadges}
                    <div style="z-index: 3;" class="loading-card d-flex justify-content-center align-items-center w-100 h-100" id="loading-${music_id}">
                        <div class="spinner-border spinner-border-xl" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>

                    <img src="${element.image}" class="weapon-img mx-auto my-3" loading="lazy" width="181px" height="136px" alt=" ">
                    
                    <div class="d-flex align-items-center g-3">
                    
                    </div>
                    
                    <h5 class="weapon-skin-title text-roboto ms-3">
                        ${element.name.slice(12)}
                    </h5>
                    <div class="d-flex gap-2 px-3 mt-auto">
                        <button class="btn btn-sm btn-primary w-100" onclick="changeMusic('${steamid}', '${music_id}')">Equip</button>
                    </div>
                </div>
            `

            document.getElementById('skinsContainer').appendChild(card)
        }
    });

}
