const { checkPermission } = require('@lib/permission');
const { checkWebToken } = require('@lib/token');
const { getUUIDRouteOwner } = require('@lib/cache');
const { InvalidToken, TooManyRequests, PermissionsError } = require('@lib/errors');
const Joi = require('joi');
const { webtoken } = require('@lib/postgres');
const useragent = require('express-useragent');

/**
 * Async function to verify the request based on the given permission. User data will be added to the request. (req.user)
 * @param {String} param_uuid_key 
 * @param {String} owner_mode
 * @returns 
 */
const verifyOwner = (param_uuid_key, owner_mode) => {
    return async (req, res) => {
        try {
            const ValidateUUID = Joi.string().uuid().required();
            const uuid = await ValidateUUID.validateAsync(req.params[param_uuid_key]);

            const owner_result = await getUUIDRouteOwner(uuid, owner_mode);

            // Check if object has key "uuid_response"
            if (!owner_result.hasOwnProperty("uuid_response")) {
                throw new Error('No UUID Response');
            }

            if(req.user.user_id !== owner_result.uuid_response) {
                throw new PermissionsError('Does not own this object');
            }

            req[owner_mode] = owner_result;
        } catch (error) {
            return error; // This will trigger global error handler as we are returning an Error
        }
    };
};

module.exports = {
    verifyOwner
};