const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('module-alias/register')

const { log } = require('@lib/logger');

process.log = {};
process.log = log;

const { WipeCache } = require('@lib/cache');

(async function () {
    await WipeCache();
    console.log("Cache wiped!");
    process.exit(0);
})();