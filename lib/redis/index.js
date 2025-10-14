const Redis = require("ioredis");

const redis = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    username: process.env.REDIS_USER || "default",
    password: process.env.REDIS_PASSWORD || "default",
    db: process.env.REDIS_DB || 0,
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
/** 
 * A OAuth Session is sotring data for the temporary code sent to the user after authorizing the app
 * @typedef OAuthSession
 * @property {string} user_id - The ID of the user
 * @property {string} oAuthApp_id - The ID of the OAuth App
 * @property {string} secret - The secret of the OAuth App
 */

/**
 * Store the OAuth Session in the Redis Database, so we do not have to store it in the database
 * @param {String} token 
 * @param {Object} data 
 * @returns {Promise<void>}
 */
const addOAuthSession = (token, data) => {
    return new Promise(async (resolve, reject) => {
        await redis.set(`OAuth:${token}`, JSON.stringify(data), "EX", (parseInt(process.env.OAUTH_EXPIRE_M) || 1) * 60);
        resolve();
    })
}

/**
 * This reads the OAuth Session from the Redis Database, and then deletes it
 * @param {String} token 
 * @returns {Promise<OAuthSession>}
 */
const readOAuthSession = (token) => {
    return new Promise(async (resolve, reject) => {
        const data = JSON.parse(await redis.get(`OAuth:${token}`));
        await redis.del(`OAuth:${token}`);
        resolve(data);
    })
}

// Conformation Token Functions for registration
const CTR = {
    check: checkCTRexists,
    get: readCTR,
    delete: deleteCTR
}

// Conformation Token Functions for password reset
const RPW = {
    check: checkRPWexists,
    get: readRPW,
    delete: deleteRPW
}

// OAuth (EBG Provider) Session Functions when authorizing the app on EBG
const oAuthSession = {
    addSession: addOAuthSession,
    getSession: readOAuthSession
}

module.exports = {
    CTR: CTR,
    RPW: RPW,
    oAuthSession: oAuthSession
}