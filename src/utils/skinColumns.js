const query = require('../database/db').query;
const config = require('../../config.json');

let cachedColumns = null;

async function getWpPlayerSkinsColumns() {
    if (cachedColumns) {
        return cachedColumns;
    }

    const rows = await query(
        `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = '${config.DB.database}' AND table_name = 'wp_player_skins'`
    );

    cachedColumns = new Set(rows.map((row) => String(row.COLUMN_NAME || row.column_name || '').toLowerCase()));
    return cachedColumns;
}

async function hasWpPlayerSkinsColumn(columnName) {
    const columns = await getWpPlayerSkinsColumns();
    return columns.has(String(columnName || '').toLowerCase());
}

async function hasStickerDataColumn() {
    return hasWpPlayerSkinsColumn('sticker_data');
}

module.exports = {
    getWpPlayerSkinsColumns,
    hasWpPlayerSkinsColumn,
    hasStickerDataColumn
};
