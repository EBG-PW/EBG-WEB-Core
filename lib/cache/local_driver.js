const MegaHash = require('megahash');
const { webtoken, user } = require('@lib/postgres');
const { mergePermissions } = require('@lib/permission');

const store = new MegaHash();

/**
 * Get memory usage of the cache
 * @returns {Number}
 */
const getMemoryUsage = () => {
    return new Promise((resolve, reject) => {
        resolve(store.stats().dataSize);
    })
}

/**
 * Delete all keys from the cache
 * @returns {String}
 */
const WipeCache = () => {
    return new Promise((resolve, reject) => {
        store.clear();
        resolve('Cleaned');
    })
}

/**
 * Add a Webtoken to the Cache
 * @param {String} webtoken
 * @param {Object} user_response
 * @param {Array} formated_Permissions
 * @param {String} browser
 */
const addWebtoken = (webtoken, user_response, formated_Permissions, browser) => {
    return new Promise(async (resolve, reject) => {
        const {user_id, username, puuid, avatar_url, language, design, user_group} = user_response
        const writeResult = store.set(`WT_${webtoken}`, {
            user_id,
            username,
            puuid,
            avatar_url,
            language,
            design,
            user_group,
            browser: browser,
            permissions: formated_Permissions,
            time: new Date().getTime()
        });

        if (!writeResult) {
            throw new Error("Failed to write to MegaHash: Out of memory");
        }
        resolve({token: webtoken, user_id, puuid, username, avatar_url, user_group, language, design, formated_Permissions, webtoken});
    });
}

/**
 * @typedef {Object} WebtokenCacheResult
 * @property {String} token
 * @property {Number} user_id
 * @property {String} puuid
 * @property {String} username
 * @property {String} avatar_url
 * @property {Array} permissions
 * @property {String} browser
 * @property {String} language
 * @property {String} design
 * @property {Object} time
 */

/**
 * If the webtoken is missing from the cache, we have to check the persistant DB
 * @param {String} webtoken 
 * @returns {WebtokenCacheResult|Undefined}
 */
const getWebtokenSave = (token) => {
    return new Promise(async (resolve, reject) => {
        if (!token) return reject("No token provided");
        const inCache = store.has(`WT_${token}`)
        if (inCache) {
            process.log.debug(`Webtoken Cach Hit on ${token}`)
            resolve(store.get(`WT_${token}`));
        } else {
            process.log.debug(`Webtoken Cach Miss on ${token}`)
            const dbResult = await webtoken.get(token) // Get TokenData from DB
            // To prevent the same cache miss, we add it to the cache
            if (dbResult.length === 1) {
                const PermissionsResponse = await user.permission.get(dbResult[0].user_id)
                const Formated_Permissions = mergePermissions(PermissionsResponse.rows, dbResult[0].user_group); // Format the permissions to a array TODO: Add groups
                addWebtoken(token, dbResult[0], Formated_Permissions, dbResult[0].browser);
                resolve({ ...dbResult[0], permissions: Formated_Permissions })
            } else {
                resolve(dbResult[0])
            }
        }
    })
}

/**
 * Removes a Webtoken from the Cache
 * @param {String} token 
 */
const delWebtoken = (token) => {
    store.delete(`WT_${token}`);
}

/**
 * Removes a Webtoken and Limiter from the Cache
 * @param {String} token
 */
const logoutWebtoken = (token) => {
    store.delete(`WT_${token}`);
    store.delete(`LIM_${token}`)
} 

/**
 * Add a PSR record to the cache
 * @param {Number} routeID 
 * @param {String} type 
 * @param {String} data 
 * @param {Number} statusCode 
 * @param {Number} maxtime
 */
const addPublicStaticResponse = (routeID, type, data, statusCode, maxtime = 0) => {
    store.set(`PSR_${routeID}`, { type, data, time: new Date().getTime(), statusCode });
}

/**
 * Get a PSR record from the cache but only returns it if it is not older than maxtime
 * @param {Number} routeID 
 * @param {Number} maxtime 
 * @returns {Object|Boolean}
 */
const getPublicStaticResponseSave = (routeID, maxtime) => {
    return new Promise(async (resolve, reject) => {
        if (!routeID) return reject("No routeID provided");
        if (!maxtime) return reject("No maxtime provided");
        if (store.has(`PSR_${routeID}`)) {
            // Check time
            const storedItem = store.get(`PSR_${routeID}`);
            const time = new Date().getTime();
            if (time - storedItem.time > maxtime) {
                // Delete the item
                store.delete(`PSR_${routeID}`);
                resolve(false);
            } else {
                resolve(storedItem);
            }
        } else {
            resolve(false);
        }
    });
}

/**
 * Add a pSR record to the cache
 * @param {Number} routeID 
 * @param {String} webtoken 
 * @param {String} type 
 * @param {String} data 
 * @param {Number} statusCode 
 */
const addPrivateStaticResponse = (routeID, webtoken, type, data, statusCode) => {
    store.set(`pSR_${routeID}_${webtoken}`, { type, data, time: new Date().getTime(), statusCode });
}

/**
 * Get a pSR record from the cache but only returns it if it is not older than maxtime
 * @param {Number} routeID 
 * @param {String} webtoken 
 * @param {Number} maxtime 
 * @returns {Object|Boolean}
 */
const getPrivateStaticResponseSave = (routeID, webtoken, maxtime) => {
    if (store.has(`pSR_${routeID}_${webtoken}`)) {
        // Check time
        const storedItem = store.get(`pSR_${routeID}_${webtoken}`);
        const time = new Date().getTime();
        if (time - storedItem.time > maxtime) {
            // Delete the item
            store.delete(`pSR_${routeID}_${webtoken}`);
            return false;
        } else {
            return storedItem;
        }
    } else {
        return false;
    }
}

/**
 * Increase the IPs request count, or add a new entry if it does not exist
 * Returns true if the IP is blocked
 * @param {String} ip 
 * @param {Number} cost 
 */
const IPLimit = (ip, cost = 1) => {
    if (typeof cost !== 'number') throw new Error('Cost must be a number');
    if (cost < 0) throw new Error('Cost must be a positive number');
    // Check if the IP is in the cache
    if (!store.has(`IPL_${ip}`)) {
        store.set(`IPL_${ip}`, { r: 0 + cost, t: new Date().getTime() });
        return {result: false};
    } else {
        // IP is in the cache, increase the request count
        const current = store.get(`IPL_${ip}`);
        if (current.r + cost < Number(process.env.DECREASEPERMIN)) {
            const reduced = ((new Date().getTime() - current.t) / (1000 * 60)) * Number(process.env.DECREASEPERMIN);
            // Reduce requests by the time passed but make sure its not below 0 and add the cost
            const newCount = Math.max(0, current.r - reduced) + cost;
            store.set(`IPL_${ip}`, { r: newCount, t: new Date().getTime() });
            return {result: false};
        } else {
            const reduced = ((new Date().getTime() - current.t) / (1000 * 60)) * Number(process.env.DECREASEPERMIN);
            // Reduce requests by the time passed but make sure its not below 0 and add the cost
            const newCount = Math.max(0, current.r - reduced);
            store.set(`IPL_${ip}`, { r: newCount, t: new Date().getTime() });
            // Calculate the time when the next request is possible
            const time = (((newCount - (Number(process.env.DECREASEPERMIN) - 1)) / Number(process.env.DECREASEPERMIN) * 60)*1000).toFixed(0);
            return {result: true, retryIn: time};
        }
    }
}

/**
 * Returns true if the IP is blocked
 * @param {String} ip 
 * @returns 
 */
const IPCheck = (ip) => {
    if (!store.has(`IPL_${ip}`)) {
        return {result: false};
    } else {
        const current = store.get(`IPL_${ip}`);
        const reduced = ((new Date().getTime() - current.t) / (1000 * 60)) * Number(process.env.DECREASEPERMIN);
        const newCount = Math.max(0, current.r - reduced);
        store.set(`IPL_${ip}`, { r: newCount, t: new Date().getTime() });
        if (newCount < Number(process.env.DECREASEPERMIN) - 1) {
            return {result: false};
        } else {
            // Calculate the time when the next request is possible
            const time = (((newCount - (Number(process.env.DECREASEPERMIN) - 1)) / Number(process.env.DECREASEPERMIN) * 60)*1000).toFixed(0);
            return {result: true, retryIn: time};
        }
    }
}

/**
 * Increase the limiters request count, or add a new entry if it does not exist
 * Returns true if the limiter is saturated
 * @param {String} key 
 * @param {Number} cost 
 */
const LimiterMiddleware = (key, cost = 1) => {
    if (typeof cost !== 'number') throw new Error('Cost must be a number');
    if (cost < 0) throw new Error('Cost must be a positive number');
    // Check if the key is in the cache
    if (!store.has(`LIM_${key}`)) {
        store.set(`LIM_${key}`, { r: 0 + cost, t: new Date().getTime() });
        return {result: false};
    } else {
        // Key is in the cache, increase the request count
        const current = store.get(`LIM_${key}`);
        const reduced = ((new Date().getTime() - current.t) / (1000 * 60)) * Number(process.env.DECREASEPERMIN);
        if ((current.r - reduced) + cost < Number(process.env.DECREASEPERMIN)) {
            // Reduce requests by the time passed but make sure its not below 0 and add the cost
            const newCount = Math.max(0, current.r - reduced) + cost;
            store.set(`LIM_${key}`, { r: newCount, t: new Date().getTime() });
            return {result: false};
        } else {
            // Reduce requests by the time passed but make sure its not below 0 and add the cost
            const newCount = Math.max(0, current.r - reduced);
            store.set(`LIM_${key}`, { r: newCount, t: new Date().getTime() });
            // Calculate the time when the next request is possible
            const time = (((newCount - (Number(process.env.DECREASEPERMIN) - 1)) / Number(process.env.DECREASEPERMIN) * 60)*1000).toFixed(0);
            return {result: true, retryIn: time};
        }
    }
}

module.exports = {
    WipeCache: WipeCache,
    getMemoryUsage: getMemoryUsage,
    addWebtoken: addWebtoken,
    getWebtokenSave: getWebtokenSave,
    delWebtoken: delWebtoken,
    logoutWebtoken: logoutWebtoken,
    addPublicStaticResponse: addPublicStaticResponse,
    getPublicStaticResponseSave: getPublicStaticResponseSave,
    addPrivateStaticResponse: addPrivateStaticResponse,
    getPrivateStaticResponseSave: getPrivateStaticResponseSave,
    IPLimit: IPLimit,
    IPCheck: IPCheck,
    LimiterMiddleware: LimiterMiddleware
}