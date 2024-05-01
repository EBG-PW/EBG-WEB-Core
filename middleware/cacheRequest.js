const { addPublicStaticResponse, getPublicStaticResponseSave, addPrivateStaticResponse, getPrivateStaticResponseSave } = require('@lib/cache');

/**
 * Will only work on send and json
 * @param {Number} duration | In ms
 * @returns 
 */
const plublicStaticCache = (duration) => {
    return async (req, res) => {
        try {
            const oldSend = res.send;
            const oldJson = res.json;

            res.send = function (data) {
                res.body = data;
                if (!res.bodyType) res.bodyType = 'string';
                oldSend.apply(res, arguments);
            }

            res.json = function (obj) {
                res.bodyType = 'json';
                oldJson.call(this, obj);
            };

            const cacheResult = await getPublicStaticResponseSave(req.route.id, duration);
            // If we get a cache hit we will return the data
            if (cacheResult) {
                process.log.debug(`Public Static Cache Hit on ${req.route.pattern}`)
                res.status(cacheResult.statusCode);
                if (cacheResult.type === 'string') return res.send(cacheResult.data)
                if (cacheResult.type === 'json') return res.json(JSON.parse(cacheResult.data))
            };

            res.on('finish', () => {
                // Cache the data if the request was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    addPublicStaticResponse(req.route.id, res.bodyType, res.body, res.statusCode, duration)
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
                if (!res.bodyType) res.bodyType = 'string';
                oldSend.apply(res, arguments);
            }

            res.json = function (obj) {
                res.bodyType = 'json';
                oldJson.call(this, obj);
            };

            const cacheResult = await getPrivateStaticResponseSave(req.route.id, req.authorization, duration);
            // If we get a cache hit we will return the data
            if (cacheResult) {
                process.log.debug(`Private Static Cache Hit for ${req.user.username} on ${req.route.pattern}`)
                res.status(cacheResult.statusCode);
                if (cacheResult.type === 'string') return res.send(cacheResult.data)
                if (cacheResult.type === 'json') return res.json(JSON.parse(cacheResult.data))
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