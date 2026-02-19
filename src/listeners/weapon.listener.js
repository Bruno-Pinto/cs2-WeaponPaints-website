const query = require('../database/db').query
const Logger = require('../utils/logger')

// Helper function to resolve team string to weapon_team values
const resolveTeams = (teamStr) => {
    if (!teamStr || teamStr === "both") return [2, 3];
    return teamStr === "t" ? [2] : [3];
};

module.exports = (io, socket) => {
    async function changeKnife(data) {
        const teams = resolveTeams(data.team);
        Logger.sql.trace(`User ${data.steamUserId} changed their knife to ${data.weaponid} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getKnife = await query(`SELECT * FROM wp_player_knife WHERE steamid = ${data.steamUserId} AND weapon_team = ${weaponTeam}`);
            if (getKnife.length >= 1) {
                await query(`UPDATE wp_player_knife SET knife = '${data.weaponid}' WHERE steamid = ${data.steamUserId} AND weapon_team = ${weaponTeam}`);
            } else {
                await query(`INSERT INTO wp_player_knife (steamid, weapon_team, knife) VALUES (${data.steamUserId}, ${weaponTeam}, '${data.weaponid}')`);
            }
        }

        const allKnives = await query(`SELECT * FROM wp_player_knife WHERE steamid = ${data.steamUserId}`);
        socket.emit('knife-changed', {knife: data.weaponid, knives: allKnives});
    }

    async function changeGloves(data) {
        const teams = resolveTeams(data.team);
        Logger.sql.trace(`User ${data.steamUserId} changed their gloves to ${data.weaponid} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getGloves = await query(`SELECT * FROM wp_player_gloves WHERE steamid = ${data.steamUserId} AND weapon_team = ${weaponTeam}`);
            if (getGloves.length >= 1) {
                await query(`UPDATE wp_player_gloves SET weapon_defindex = '${data.weaponid}' WHERE steamid = ${data.steamUserId} AND weapon_team = ${weaponTeam}`);
            } else {
                await query(`INSERT INTO wp_player_gloves (steamid, weapon_team, weapon_defindex) VALUES (${data.steamUserId}, ${weaponTeam}, '${data.weaponid}')`);
            }
        }

        const allGloves = await query(`SELECT * FROM wp_player_gloves WHERE steamid = ${data.steamUserId}`);
        socket.emit('glove-changed', {weaponid: data.weaponid, gloves: allGloves});
    }

    async function changeAgent(data) {
        const teams = resolveTeams(data.team);
        Logger.sql.trace(`User ${data.steamid} changed their agent to ${data.model} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getAgent = await query(`SELECT * FROM wp_player_agents WHERE steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);
            const column = data.team === 'ct' || (weaponTeam === 3) ? 'agent_ct' : 'agent_t';

            if (getAgent.length >= 1) {
                await query(`UPDATE wp_player_agents SET ${column} = '${data.model}' WHERE steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);
            } else {
                await query(`INSERT INTO wp_player_agents (steamid, weapon_team, ${column}) VALUES (${data.steamid}, ${weaponTeam}, '${data.model}')`);
            }
        }

        const agents = await query(`SELECT * FROM wp_player_agents WHERE steamid = ${data.steamid}`);
        socket.emit('agent-changed', { agents: agents, currentAgent: data.model });
    }

    async function changeSkin(data) {
        const teams = resolveTeams(data.team);
        Logger.sql.trace(`User ${data.steamid} changed their skin of ${data.weaponid} to ${data.paintid} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getSkin = await query(`SELECT * FROM wp_player_skins WHERE weapon_defindex = ${data.weaponid} AND steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);

            if (getSkin.length >= 1) {
                await query(`UPDATE wp_player_skins SET weapon_paint_id = ${data.paintid} WHERE steamid = ${data.steamid} AND weapon_defindex = ${data.weaponid} AND weapon_team = ${weaponTeam}`);
            } else {
                const defaultWear = 0.000001;
                const defaultSeed = 1;
                await query(`INSERT INTO wp_player_skins (steamid, weapon_defindex, weapon_team, weapon_paint_id, weapon_wear, weapon_seed) VALUES (${data.steamid}, ${data.weaponid}, ${weaponTeam}, ${data.paintid}, ${defaultWear}, ${defaultSeed})`);
            }
        }

        const newSkins = await query(`SELECT * FROM wp_player_skins WHERE steamid = ${data.steamid}`);
        socket.emit('skin-changed', {weaponid: data.weaponid, paintid: data.paintid, newSkins: newSkins});
    }

    async function changeMusic(data) {
        const teams = resolveTeams(data.team);
        Logger.sql.trace(`User ${data.steamid} changed their music kit to ${data.id} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getMusic = await query(`SELECT * FROM wp_player_music WHERE steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);

            if (getMusic.length >= 1) {
                await query(`UPDATE wp_player_music SET music_id = ${data.id} WHERE steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);
            } else {
                await query(`INSERT INTO wp_player_music (steamid, weapon_team, music_id) VALUES (${data.steamid}, ${weaponTeam}, ${data.id})`);
            }
        }

        const newMusic = await query(`SELECT * FROM wp_player_music WHERE steamid = ${data.steamid}`);
        socket.emit('music-changed', {currentMusic: data.id, music: newMusic});
    }

    async function resetSkin(data) {
        const teams = resolveTeams(data.team);

        for (const weaponTeam of teams) {
            await query(`DELETE FROM wp_player_skins WHERE steamid = ${data.steamid} AND weapon_defindex = ${data.weaponid} AND weapon_team = ${weaponTeam}`);
        }

        socket.emit('skin-reset', {weaponid: data.weaponid});
    }

    async function changeParams(data) {
        const teams = resolveTeams(data.team);
        data.float = (data.float == '') ? '0.000001' : data.float;
        data.pattern = (data.pattern == '') ? '1' : data.pattern;

        for (const weaponTeam of teams) {
            await query(`UPDATE wp_player_skins SET weapon_wear = ${data.float}, weapon_seed = ${data.pattern} WHERE steamid = '${data.steamid}' AND weapon_defindex = ${data.weaponid} AND weapon_paint_id = ${data.paintid} AND weapon_team = ${weaponTeam}`);
        }

        socket.emit('params-changed');
    }

    socket.on("change-knife",    changeKnife);
    socket.on("change-glove",   changeGloves);
    socket.on("change-agent",    changeAgent);
    socket.on("change-skin",      changeSkin);
    socket.on("change-music",    changeMusic);
    socket.on("reset-skin",        resetSkin);
    socket.on("change-params",  changeParams);
}
