const { checkPermission } = require('@lib/permission');
const { checkWebToken } = require('@lib/token');
const { delWebtoken, IPLimit, IPCheck } = require('@lib/cache');
const { InvalidToken, TooManyRequests, PermissionsError } = require('@lib/errors');
const { webtoken } = require('@lib/postgres');
const useragent = require('express-useragent');

/**
 * Async function to verify the request based on the given permission. User data will be added to the request. (req.user)
 * @param {String} permission 
 * @returns 
 */
const verifyRequest = (permission) => {
    return async (req, res) => {
        try {
            let IP;
            let UserToken;
            const source = req.headers['user-agent']
            const UserAgent = useragent.parse(source)
            if (process.env.CLOUDFLARE_PROXY === 'true' || process.env.CLOUDFLARE_PROXY == true) {
                if(req.headers['x-forwarded-for']) process.log.warn('Requests are comming from a normal proxy but cloudflare proxy is set in the env file')
                if(!req.headers['cf-connecting-ip']) process.log.warn('Cloudflare proxy is set in the env file but requests are not comming from a cloudflare proxy')
                IP = req.headers['cf-connecting-ip'] || req.ip //This only works with cloudflare proxy
            } else if (process.env.ANY_PROXY === 'true' || process.env.ANY_PROXY == true) {
                if(req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a cloudflare but normal proxy is set in the env file')
                if(!req.headers['x-forwarded-for']) process.log.warn('Normal proxy is set in the env file but requests are not comming from a normal proxy')
                IP = req.headers['x-forwarded-for'] || req.ip //This only works without cloudflare
            } else {
                if(req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a proxy but no proxy is set in the env file')
                IP = req.ip //This only works without any proxy
            }

            const isBlocked = await IPCheck(IP);
            if(isBlocked.result) throw new TooManyRequests('Too Many Requests', isBlocked.retryIn)

            // Get the token from the header
            if (req.headers['authorization'] != undefined) {
                UserToken = req.headers['authorization'].replace('Bearer ', '');
            } else {
                throw new InvalidToken('No Token Provided');
            }

            // Check if the token is valid
            const WebTokenResponse = await checkWebToken(UserToken, UserAgent.browser);
            if (!WebTokenResponse.State) {
                if (WebTokenResponse.DidExist) {
                    // The token existed, but was invalid for this request. Delete it from the database and cache
                    process.log.debug(`Deleting Token ${UserToken} from database`);
                    await webtoken.delete(UserToken)
                    delWebtoken(UserToken);
                } else {
                    // The token did not exist, lets add the reuqest IP to the cache to stop brute force attacks andreduce DB stress
                    const IPLimiter = await IPLimit(IP);

                    // If ture, then the IP has been in rate limit
                    if (IPLimiter.result) throw new TooManyRequests('Too Many Requests', isBlocked.retryIn)
                }
                throw new InvalidToken('Invalid Token');
            }

            // Check if the user has the permission for the request
            const allowed = checkPermission(WebTokenResponse.Data.permissions, permission);
            if (!allowed.result) throw new PermissionsError('NoPermissions', permission);
            process.log.debug(`Permission Granted for ${WebTokenResponse.Data.username} to ${permission}`);

            // Add the user data to the request
            req.user = WebTokenResponse.Data;
            req.authorization = UserToken;

        } catch (error) {
            return error; // This will trigger global error handler as we are returning an Error
        }
    };
};

module.exports = {
    verifyRequest
};