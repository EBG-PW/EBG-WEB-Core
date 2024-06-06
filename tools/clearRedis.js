const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('module-alias/register')

const Redis = require('ioredis');

const { log } = require('@lib/logger');

process.log = {};
process.log = log;

const redisData = {
    port: process.env.Redis_Port || 6379,
    host: process.env.Redis_Host || "127.0.0.1",
    username: process.env.Redis_User || "default",
    password: process.env.Redis_Password || "default",
}

/**
 * Delete all keys from the cache
 * @param {Number} db The database to clear
 * @returns {String}
 */
const WipeCache = (db) => {
    return new Promise(async (resolve, reject) => {
        redisData.db = db || 0;
        const redis = new Redis(redisData);

        const stream = redis.scanStream({
            match: '*'
        });
        stream.on('data', function (keys) {
            // `keys` is an array of strings representing key names
            if (keys.length) {
                const pipeline = redis.pipeline();
                keys.forEach(function (key) {
                    pipeline.del(key);
                });
                pipeline.exec();
            }
        });
        stream.on('end', function () {
            resolve(`Cleaned DB:${db} successfully`);
            redis.quit();
        });
    })
}

(async function () {
    console.log(await WipeCache(0));
    console.log(await WipeCache(1));
})();