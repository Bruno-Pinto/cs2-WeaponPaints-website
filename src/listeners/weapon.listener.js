const query = require('../database/db').query
const Logger = require('../utils/logger')
const { hasStickerDataColumn } = require('../utils/skinColumns')
const { clampNumber, clampInteger, sanitizeEditorStatePayload, serializeStickerPayload } = require('../utils/sticker.schema')

const escapeSqlString = (value) => String(value).replace(/'/g, "\\'");

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
        const hasStickerColumn = await hasStickerDataColumn();
        const hasStickerPayload = Array.isArray(data.stickers) || Boolean(data.editor3d && Array.isArray(data.editor3d.stickers));
        const editorState = sanitizeEditorStatePayload({
            weaponId: data.weaponid,
            paintId: data.paintid,
            wear: data.float,
            seed: data.pattern,
            stickers: data.stickers || data.editor3d?.stickers
        });
        const stickerJson = escapeSqlString(serializeStickerPayload(editorState.stickers));
        Logger.sql.trace(`User ${data.steamid} changed their skin of ${data.weaponid} to ${data.paintid} for team(s) ${teams.join(',')}`);

        for (const weaponTeam of teams) {
            const getSkin = await query(`SELECT * FROM wp_player_skins WHERE weapon_defindex = ${data.weaponid} AND steamid = ${data.steamid} AND weapon_team = ${weaponTeam}`);

            if (getSkin.length >= 1) {
                if (hasStickerColumn && hasStickerPayload) {
                    await query(`UPDATE wp_player_skins SET weapon_paint_id = ${data.paintid}, sticker_data = '${stickerJson}' WHERE steamid = ${data.steamid} AND weapon_defindex = ${data.weaponid} AND weapon_team = ${weaponTeam}`);
                } else {
                    await query(`UPDATE wp_player_skins SET weapon_paint_id = ${data.paintid} WHERE steamid = ${data.steamid} AND weapon_defindex = ${data.weaponid} AND weapon_team = ${weaponTeam}`);
                }
            } else {
                const defaultWear = 0.000001;
                const defaultSeed = 1;
                if (hasStickerColumn && hasStickerPayload) {
                    await query(`INSERT INTO wp_player_skins (steamid, weapon_defindex, weapon_team, weapon_paint_id, weapon_wear, weapon_seed, sticker_data) VALUES (${data.steamid}, ${data.weaponid}, ${weaponTeam}, ${data.paintid}, ${defaultWear}, ${defaultSeed}, '${stickerJson}')`);
                } else {
                    await query(`INSERT INTO wp_player_skins (steamid, weapon_defindex, weapon_team, weapon_paint_id, weapon_wear, weapon_seed) VALUES (${data.steamid}, ${data.weaponid}, ${weaponTeam}, ${data.paintid}, ${defaultWear}, ${defaultSeed})`);
                }
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

        socket.emit('skin-reset', {weaponid: data.weaponid, team: data.team || 'both'});
    }

    async function changeParams(data) {
        const teams = resolveTeams(data.team);
        const hasStickerColumn = await hasStickerDataColumn();
        const hasStickerPayload = Array.isArray(data.stickers) || Boolean(data.editor3d && Array.isArray(data.editor3d.stickers));
        const editorState = sanitizeEditorStatePayload({
            weaponId: data.weaponid,
            paintId: data.paintid,
            wear: data.float,
            seed: data.pattern,
            stickers: data.stickers || data.editor3d?.stickers
        });
        const safeFloat = clampNumber(data.float, 0, 1, 0.000001);
        const safePattern = clampInteger(data.pattern, 1, 1000, 1);
        const stickerJson = escapeSqlString(serializeStickerPayload(editorState.stickers));

        Logger.sql.trace(`User ${data.steamid} changing params - weaponid: ${data.weaponid}, paintid: ${data.paintid}, float: ${safeFloat}, pattern: ${safePattern}, teams: ${teams}`);

        for (const weaponTeam of teams) {
            const updateQuery = hasStickerColumn && hasStickerPayload
                ? `UPDATE wp_player_skins SET weapon_wear = ${safeFloat}, weapon_seed = ${safePattern}, sticker_data = '${stickerJson}' WHERE steamid = '${data.steamid}' AND weapon_defindex = ${data.weaponid} AND weapon_paint_id = ${data.paintid} AND weapon_team = ${weaponTeam}`
                : `UPDATE wp_player_skins SET weapon_wear = ${safeFloat}, weapon_seed = ${safePattern} WHERE steamid = '${data.steamid}' AND weapon_defindex = ${data.weaponid} AND weapon_paint_id = ${data.paintid} AND weapon_team = ${weaponTeam}`;
            Logger.sql.trace(`Executing update query: ${updateQuery}`);
            await query(updateQuery);
        }

        socket.emit('params-changed', {
            float: safeFloat,
            pattern: safePattern,
            editor3d: editorState,
            stickers: hasStickerPayload ? editorState.stickers : undefined
        });
    }

    socket.on("change-knife",    changeKnife);
    socket.on("change-glove",   changeGloves);
    socket.on("change-agent",    changeAgent);
    socket.on("change-skin",      changeSkin);
    socket.on("change-music",    changeMusic);
    socket.on("reset-skin",        resetSkin);
    socket.on("change-params",  changeParams);
}
