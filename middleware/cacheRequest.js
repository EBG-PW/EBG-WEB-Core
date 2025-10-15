const { deleteOverwriteCacheKey, addAutomaticStaticResponse, getAutomaticStaticResponseSave } = require('@lib/cache');
const { CustomError } = require('@lib/errors');

const oHash = require('object-hash');

/**
 * Cache responses on a per routeID, per route parameter, per user basis with the ability to honor query parameters
 * To make is user specific add user.user_id, this will use req.user.user_id to oHash
 * To make it query specific add query.id, this will use req.query.id to oHash
 * @param {Number} duration | In ms
 * @param {Array} objOptions | Array that MUST contain all important req_object keys for this cache
 * @param {String} overwrite | Update the cache if this key exists within the cache
 * @returns 
 */
const staticCache = (duration, objOptions = [], overwrite = null) => {
    return async (req, res, next) => {
        try {
            // Save the original methods into a temp variable
            const oldSend = res.send;
            const oldJson = res.json;

            let cachHash; // The hash or the cache key

            if (objOptions.length !== 0) {
                let importantDataObject = {};
                for (let i = 0; objOptions.length > i; i++) {
                    // Check if key exists, the array can have layered strings like "user.user_id" referring to req.user.user_id
                    // For quary data we can use query.id for req.query.id
                    const keySplit = objOptions[i].split(".");

                    const value = keySplit.reduce((prev, curr) => {
                        return prev ? prev[curr] : null;
                    }, req);
                    importantDataObject[objOptions[i]] = value;
                    if (value === null) {
                        process.log.debug(`Key ${objOptions[i]} does not exist in the request object`); // Debugging line
                    }
                }

                // Take params into account if they exist
                if (req.params && Object.keys(req.params).length > 0) {
                    importantDataObject['params'] = req.params;
                }

                cachHash = oHash(importantDataObject, { algorithm: process.env.INTERNAL_HASH || "sha3-256" });
            } else {
                let importantDataObject = {};
                // Take params into account if they exist
                if (req.params) {
                    importantDataObject['params'] = req.params;
                }

                cachHash = oHash(importantDataObject, { algorithm: process.env.INTERNAL_HASH || "sha3-256" });
            }

            res.send = function (data) {
                res.body = data;
                if (!res.bodyType) res.bodyType = 0;
                res.statusCode = res.statusCode || 200;
                oldSend.apply(res, arguments);
            }

            res.json = function (obj) {
                res.bodyType = 1;
                res.statusCode = res.statusCode || 200;
                res.type('application/json')
                oldJson.call(this, obj);
            };

            if (overwrite) {
                overwrite = overwrite.replace(/:(\w+)/g, (match, p1) => {
                    return req.params[p1];
                });

                const override_del_result = await deleteOverwriteCacheKey(overwrite); // Store if there was a cache key that was deleted

                // A 0 is returned if no key was delted, so we can serve the cache
                // But if a anything above 0 is returned we wanna overwrite the cache
                if (override_del_result === 0) {
                    const cacheResult = await getAutomaticStaticResponseSave(req.route.id, cachHash, duration);
                    // If we get a cache hit we will return the data
                    if (cacheResult) {
                        process.log.debug(`Public Static Cache Hit on ${req.route.pattern}`);
                        res.status(cacheResult.statusCode);
                        if (cacheResult.type === 0) return res.send(cacheResult.data);
                        if (cacheResult.type === 1) return res.json(JSON.parse(cacheResult.data));
                    };
                } else {
                    process.log.debug(`Cache result for ${req.route.pattern} was deleted because of overwrite key ${overwrite}`);
                }
            }

            res.on('finish', () => {
                // Cache the data if the request was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    addAutomaticStaticResponse(req.route.id, cachHash, res.bodyType, res.body, res.statusCode, duration);
                } else {
                    process.log.debug(`Not caching ${req.route.pattern} because of status code ${res.statusCode}`);
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    staticCache
};