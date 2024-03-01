const Redis = require("ioredis");

/**
 * RedisKeys
 * CFR: ConfirmationToken Registration
 * RPW: ResetPassword
 */

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
 * Get memory usage of the cache
 * @returns {Number}
 */
const getMemoryUsage = () => {
    return new Promise(async (resolve, reject) => {
        let memoryArray = await redis.memory("STATS");
        resolve(memoryArray[3]);
    })
}

const addConfirmationToken = (token, userId) => {
    return new Promise(async (resolve, reject) => {
        await redis.set(`CFR:${token}`, JSON.stringify({
            userId: userId
        }), "EX", parseInt(process.env.CONFIRMATIONTOKEN_EXPIRE_REGISTRATION) * 60);
        resolve();
    })
}

const addResetPasswordToken = (token, userId) => {
    return new Promise(async (resolve, reject) => {
        await redis.set(`RPW:${token}`, JSON.stringify({
            userId: userId
        }), "EX", parseInt(process.env.CONFIRMATIONTOKEN_EXPIRE_PASSWORDRESET) * 60);
        resolve();
    });
}

module.exports = {
    getMemoryUsage: getMemoryUsage,
    addConfirmationToken: addConfirmationToken,
    addResetPasswordToken: addResetPasswordToken
}