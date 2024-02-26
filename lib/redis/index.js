const Redis = require("ioredis");

const redis = new Redis({
    port: process.env.Redis_Port || 6379,
    host: process.env.Redis_Host || "127.0.0.1",
    username: process.env.Redis_User || "default",
    password: process.env.Redis_Password || "default",
    db: process.env.Redis_DB || 0,
});

redis.on("error", (err) => {
    process.log.error(err);
    process.exit(2);
});

/**
 * Check if a ConfirmationToken Registration exists
 * @param {string} token - The ConfirmationToken Registration
 */
const checkCTRexists = (token) => {
    return new Promise(async (resolve, reject) => {
        let exists = await redis.exists(`CFR:${token}`);
        resolve(exists);
    })
}

/**
 * Get the UserID from a ConfirmationToken Registration
 * @param {string} token - The ConfirmationToken Registration
 */
const getCTRuserid = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = JSON.parse(await redis.get(`CFR:${token}`));
        resolve(data);
    })
}

/**
 * Delete a ConfirmationToken Registration
 * @param {string} token 
 * @returns 
 */
const deleteCTR = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = await redis.del(`CFR:${token}`);
        resolve(data);
    })
}

const CTR = {
    check: checkCTRexists,
    get: getCTRuserid,
    delete: deleteCTR
}

module.exports = {
    CTR: CTR
}