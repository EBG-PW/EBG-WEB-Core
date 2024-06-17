const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { projectactivities } = require('@lib/postgres');
const HyperExpress = require('hyper-express');
const { writeOverwriteCacheKey } = require('@lib/cache');
const { InvalidRouteJson, DBError, InvalidRouteInput, CustomError } = require('@lib/errors');
const { plublicStaticCache } = require('@middleware/cacheRequest');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const { default_group, default_member_group } = require('@config/permissions');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'oAuth_Apps'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const ValidateUUID = Joi.object({
    id: Joi.string().uuid().required()
});

const ValidateCreateOAuthApp = Joi.object({
    name: Joi.string().required(),
    redirect_uri: Joi.string().uri().required(),
    scopes: Joi.array().items(Joi.string()).required()
});

router.get('/:id/oauthclient', verifyRequest('web.event.oauth.read'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const has_oauth = await projectactivities.oAuth.hasClient(value.id);
    res.status(200);
    res.json({
        message: "Has OAuth Client",
        result: has_oauth
    });
});

router.post('/:id/oauthclient', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {
    const value = await ValidateCreateOAuthApp.validateAsync(req.body);
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};