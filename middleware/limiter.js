const { LimiterMiddleware } = require('@lib/cache')
const { TooManyRequests } = require('@lib/errors')

/**
 * Middleware to limit requests on routes
 * @param {Number} cost 
 * @returns 
 */
const limiter = (cost = 1) => {
    return async (req, res) => {
        try {
            let key;
            if (!req.authorization) {
                if (process.env.CLOUDFLARE_PROXY === 'true' || process.env.CLOUDFLARE_PROXY == true) {
                    if(req.headers['x-forwarded-for']) process.log.warn('Requests are comming from a normal proxy but cloudflare proxy is set in the env file')
                    if(!req.headers['cf-connecting-ip']) process.log.warn('Cloudflare proxy is set in the env file but requests are not comming from a cloudflare proxy')
                    key = req.headers['cf-connecting-ip'] || req.ip //This only works with cloudflare proxy
                } else if (process.env.ANY_PROXY === 'true' || process.env.ANY_PROXY == true) {
                    if(req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a cloudflare but normal proxy is set in the env file')
                    if(!req.headers['x-forwarded-for']) process.log.warn('Normal proxy is set in the env file but requests are not comming from a normal proxy')
                    key = req.headers['x-forwarded-for'] || req.ip //This only works without cloudflare
                } else {
                    if(req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a proxy but no proxy is set in the env file')
                    key = req.ip //This only works without any proxy
                }
            } else {
                key = req.authorization;
            }

            const rateLimit = await LimiterMiddleware(key, cost);

            if (rateLimit.result) throw new TooManyRequests('Too Many Requests', rateLimit.retryIn)

        } catch (error) {
            throw error; // This will trigger global error handler as we are returning an Error
        }
    };
};

module.exports = {
    limiter
};