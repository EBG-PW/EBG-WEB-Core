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
const readCTR = (token) => {
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

/**
 * Check if a ResetPassword token exists
 * @param {string} token 
 * @returns 
 */
const checkRPWexists = (token) => {
    return new Promise(async (resolve, reject) => {
        let exists = await redis.exists(`RPW:${token}`);
        resolve(exists);
    })
}

/**
 * Get the UserID from a ResetPassword token
 * @param {string} token 
 * @returns 
 */
const readRPW = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = JSON.parse(await redis.get(`RPW:${token}`));
        resolve(data);
    })
}

/**
 * Delete a ResetPassword token
 * @param {string} token 
 * @returns 
 */
const deleteRPW = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = await redis.del(`RPW:${token}`);
        resolve(data);
    })
}

const addOAuthSession = (token, data) => {
    return new Promise(async (resolve, reject) => {
        await redis.set(`OAuth:${token}`, JSON.stringify(data), "EX", parseInt(process.env.OAUTH_EXPIRE) || 1 * 60);
        resolve();
    })
}

const readOAuthSession = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = JSON.parse(await redis.get(`OAuth:${token}`));
        resolve(data);
    })
}

const CTR = {
    check: checkCTRexists,
    get: readCTR,
    delete: deleteCTR
}

const RPW = {
    check: checkRPWexists,
    get: readRPW,
    delete: deleteRPW
}

const oAuthSession = {
    addSession: addOAuthSession,
    getSession: readOAuthSession
}

module.exports = {
    CTR: CTR,
    RPW: RPW,
    oAuthSession: oAuthSession
}