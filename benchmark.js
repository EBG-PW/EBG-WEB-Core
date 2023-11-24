require('dotenv').config();
require('module-alias/register')

const Benches = {
    localSingle: true,
    localMulti: true,
    redisSingle: true,
    redisMulti: false,
}


process.env.LOG_LEVEL = 1; // OVERRIDE LOG LEVEL

const { log } = require('@lib/logger');

process.log = {};
process.log = log;

const redis = require('@lib/cache/redis_driver');
const local = require('@lib/cache/local_driver');

const MAX_KEYS = 100 * 1000;
const METRICS_DIVISOR = MAX_KEYS / 10000;
const METRICS_EVERY = Math.floor(MAX_KEYS / METRICS_DIVISOR) || 1;
const mem_start = process.memoryUsage().rss;

let last_report = Date.now();
let now;

const numberWithDots = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const LocalSingle = () => {
    return new Promise(async (resolve, reject) => {
        for (let idx = 1; idx <= MAX_KEYS; idx++) {
            let keyBuf = Buffer.from(idx.toString(36));
            let valueBuf = Buffer.from('This is a test');

            local.addWebtoken(keyBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf);

            if (idx && (idx % METRICS_EVERY == 0)) {
                now = Date.now();
                write_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));

                // pause and do some reads
                now = Date.now();
                last_report = now;
                for (var idy = idx - METRICS_EVERY; idy < idx; idy++) {
                    let keyBuf = Buffer.from(idy.toString(36));
                    local.getWebtokenSave(keyBuf);
                }
                now = Date.now();
                read_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));
                let mem = await local.getMemoryUsage()
                console.log(
                    "(Local) Total Keys: " + numberWithDots(idx) +
                    ", Writes/sec: " + numberWithDots(write_iter_sec) +
                    ", Reads/sec: " + numberWithDots(read_iter_sec) +
                    ", Memory: " + numberWithDots((mem / 1024 / 1024).toFixed(0)) + " MB"
                );

                if (idx == MAX_KEYS) {
                    resolve();
                }

                now = Date.now();
                last_report = now;
            }
        }
    })

}

const LocalMulti = () => {
    return new Promise(async (resolve, reject) => {
        let Container = [];
        for (let idx = 1; idx <= MAX_KEYS; idx++) {
            let keyBuf = Buffer.from(idx.toString(36));
            let valueBuf = Buffer.from('This is a test');

            Container.push(local.addWebtoken(keyBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf));

            if (idx && (idx % METRICS_EVERY == 0)) {
                await Promise.all(Container);
                Container = [];
                now = Date.now();
                write_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));

                // pause and do some reads
                now = Date.now();
                last_report = now;
                for (var idy = idx - METRICS_EVERY; idy < idx; idy++) {
                    let keyBuf = Buffer.from(idy.toString(36));
                    Container.push(local.getWebtokenSave(keyBuf));
                }
                await Promise.all(Container);
                Container = [];
                now = Date.now();
                read_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));
                let mem = await local.getMemoryUsage()
                console.log(
                    "(Local) Total Keys: " + numberWithDots(idx) +
                    ", Writes/sec: " + numberWithDots(write_iter_sec) +
                    ", Reads/sec: " + numberWithDots(read_iter_sec) +
                    ", Memory: " + numberWithDots((mem / 1024 / 1024).toFixed(0)) + " MB"
                );

                if (idx == MAX_KEYS) {
                    resolve();
                }

                now = Date.now();
                last_report = now;
            }
        }
    })

}

const RedisSingle = () => {
    return new Promise(async (resolve, reject) => {
        for (let idx = 1; idx <= MAX_KEYS; idx++) {
            let keyBuf = Buffer.from(idx.toString(36));
            let valueBuf = Buffer.from('This is a test');

            await redis.addWebtoken(keyBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf);

            if (idx && (idx % METRICS_EVERY == 0)) {
                now = Date.now();
                write_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));

                // pause and do some reads
                now = Date.now();
                last_report = now;
                for (let idy = idx - METRICS_EVERY; idy < idx; idy++) {
                    let keyBuf = Buffer.from(idy.toString(36));
                    await redis.getWebtokenSave(keyBuf);
                }
                now = Date.now();
                read_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));
                let memoryArray = await redis.getMemoryUsage();
                console.log(
                    "(Redis) Total Keys: " + numberWithDots(idx) +
                    ", Writes/sec: " + numberWithDots(write_iter_sec) +
                    ", Reads/sec: " + numberWithDots(read_iter_sec) +
                    ", Memory: " + (Number(memoryArray) / 1024 / 1024).toFixed(0) + " MB "
                );

                if (idx == MAX_KEYS) {
                    resolve();
                }

                now = Date.now();
                last_report = now;
            }
        }
    })
}

const RedisMulti = () => {
    return new Promise(async (resolve, reject) => {
        let Container = [];
        for (let idx = 1; idx <= MAX_KEYS; idx++) {
            let keyBuf = Buffer.from(idx.toString(36));
            let valueBuf = Buffer.from('This is a test');

            Container.push(redis.addWebtoken(keyBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf, valueBuf));

            if (idx && (idx % METRICS_EVERY == 0)) {
                await Promise.all(Container);
                Container = [];
                now = Date.now();
                write_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));

                // pause and do some reads
                now = Date.now();
                last_report = now;
                for (let idy = idx - METRICS_EVERY; idy < idx; idy++) {
                    let keyBuf = Buffer.from(idy.toString(36));
                    Container.push(redis.getWebtokenSave(keyBuf));
                }
                await Promise.all(Container);
                Container = [];
                now = Date.now();
                read_iter_sec = Math.floor(METRICS_EVERY / ((now - last_report) / 1000));
                let memoryArray = await redis.getMemoryUsage();
                console.log(
                    "(Redis) Total Keys: " + numberWithDots(idx) +
                    ", Writes/sec: " + numberWithDots(write_iter_sec) +
                    ", Reads/sec: " + numberWithDots(read_iter_sec) +
                    ", Memory: " + (Number(memoryArray) / 1024 / 1024).toFixed(0) + " MB "
                );

                if (idx == MAX_KEYS) {
                    resolve();
                }

                now = Date.now();
                last_report = now;
            }
        }
    })
}

(async () => {
    if (Benches.localSingle) {
        console.log("Starting local benchmark, single Transaction");
        await LocalSingle();
        console.log(`LocalCache: ${await local.WipeCache()}`);
        console.log("\n\n")
    }

    if (Benches.localMulti) {
        console.log("Starting local benchmark, multi Transaction");
        await LocalMulti();
        console.log(`LocalCache: ${await local.WipeCache()}`);
        console.log("\n\n")
    }

    if (Benches.redisSingle) {
        console.log("Starting Redis benchmark, single Transaction");
        await RedisSingle();
        console.log(`RedisCache: ${await redis.WipeCache()}`);
        console.log("\n\n")
    }

    if (Benches.redisMulti) {
        console.log("Starting Redis benchmark, multi Transaction");
        await RedisMulti();
        console.log(`RedisCache: ${await redis.WipeCache()}`);
        console.log("\n\n")
    }
    process.exit(0);
})();