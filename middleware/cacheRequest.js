const { addPublicStaticResponse, getPublicStaticResponseSave, addPrivateStaticResponse, getPrivateStaticResponseSave } = require('@lib/cache');
const { CustomError } = require('@lib/errors');

const oHash = require('object-hash');

/**
 * Will only work on send and json
 * @param {Number} duration | In ms
 * @param {Array} objOptions | Array that MUST contain all important req_object keys for this cache
 * @returns 
 */
const plublicStaticCache = (duration, objOptions = []) => {
    return async (req, res) => {
        try {
            // Save the original methods into a temp variable
            const oldSend = res.send;
            const oldJson = res.json;

            let cachHash; // The hash or the cache key

            if (objOptions.length !== 0) {
                let importantDataObject = {};
                for (let i = 0; objOptions.length > i; i++) {
                    // Check if key exists, the array can have layered strings like "user.id" referring to req.user.id
                    const keySplit = objOptions[i].split(".");

                    const value = keySplit.reduce((prev, curr) => {
                        return prev ? prev[curr] : null;
                    }, req);
                    if (value !== null) {
                        // Use the original key (objOptions[i]) as the key in importantDataObject
                        importantDataObject[objOptions[i]] = value;
                    } else {
                        throw new CustomError(`Could not construct cache key for this request`).withStatus(500)
                    }
                }

                cachHash = oHash(importantDataObject, { algorithm: process.env.INTERNAL_HASH || "sha3-256" })
            } else {
                cachHash = "default"
            }

            res.send = function (data) {
                res.body = data;
                if (!res.bodyType) res.bodyType = 0;
                oldSend.apply(res, arguments);
            }

            res.json = function (obj) {
                res.bodyType = 1;
                oldJson.call(this, obj);
            };

            const cacheResult = await getPublicStaticResponseSave(`${req.route.id}-${cachHash}`, duration);
            // If we get a cache hit we will return the data
            if (cacheResult) {
                process.log.debug(`Public Static Cache Hit on ${req.route.pattern}`)
                res.status(cacheResult.statusCode);
                if (cacheResult.type === 0) return res.send(cacheResult.data)
                if (cacheResult.type === 1) return res.json(JSON.parse(cacheResult.data))
            };

            res.on('finish', () => {
                // Cache the data if the request was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    addPublicStaticResponse(`${req.route.id}-${cachHash}`, res.bodyType, res.body, res.statusCode, duration)
                } else {
                    process.log.debug(`Not caching ${req.route.pattern} because of status code ${res.statusCode}`)
                }
            });
        } catch (error) {
            return (error);
        }
    }
}

/**
 * Will only work on send and json
 * @param {Number} duration | In ms
 * @returns 
 */
const privateStaticCache = (duration) => {
    return async (req, res) => {
        try {
            const oldSend = res.send;
            const oldJson = res.json;

            res.send = function (data) {
                res.body = data;
                if (!res.bodyType) res.bodyType = 0;
                oldSend.apply(res, arguments);
            }

            res.json = function (obj) {
                res.bodyType = 1;
                oldJson.call(this, obj);
            };

            const cacheResult = await getPrivateStaticResponseSave(req.route.id, req.authorization, duration);
            // If we get a cache hit we will return the data
            if (cacheResult) {
                process.log.debug(`Private Static Cache Hit for ${req.user.username} on ${req.route.pattern}`)
                res.status(cacheResult.statusCode);
                if (cacheResult.type === 0) return res.send(cacheResult.data)
                if (cacheResult.type === 1) return res.json(JSON.parse(cacheResult.data))
            };

            res.on('finish', () => {
                // Cache the data if the request was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    addPrivateStaticResponse(req.route.id, req.authorization, res.bodyType, res.body, res.statusCode, duration)
                } else {
                    process.log.debug(`Not caching ${req.route.pattern} because of status code ${res.statusCode}`)
                }
            });
        } catch (error) {
            return (error);
        }
    }
}


module.exports = {
    plublicStaticCache,
    privateStaticCache
};