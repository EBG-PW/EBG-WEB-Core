const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { projectactivities } = require('@lib/postgres');
const HyperExpress = require('hyper-express');
const randomstring = require('randomstring');
const { InvalidRouteJson, DBError, InvalidRouteInput, CustomError } = require('@lib/errors');
const oAuthPermissions = require('@lib/oauth/permissions');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'oAuth_Apps'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const ValidateUUID = Joi.object({
    projectactivities_puuid: Joi.string().uuid().required()
});

const ValidateUpdateName = Joi.object({
    event_name: Joi.fullysanitizedString().min(3).max(128).required()
});

const validateUpdateRedirectURI = Joi.object({
    event_redirect_uri: Joi.string().uri().required()
});

const ValidateCreateOAuthApp = Joi.object({
    name: Joi.fullysanitizedString().min(3).max(128).required(),
    redirect_uri: Joi.string().uri().required(),
    scope: Joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER).required()
});

router.get('/:projectactivities_puuid/oauthclient', verifyRequest('web.event.oauth.read'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const has_oauth = await projectactivities.oAuth.hasClient(param.projectactivities_puuid);
    res.status(200);
    res.json({
        message: "Has OAuth Client",
        result: has_oauth
    });
});

router.post('/:projectactivities_puuid/oauthclient/avatar_url', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {

});

router.post('/:projectactivities_puuid/oauthclient/name', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const value = await ValidateUpdateName.validateAsync(await req.json());

    await projectactivities.oAuth.updateName(param.projectactivities_puuid, value.event_name);
    res.status(200);
    res.json({
        message: "OAuth Client Name Updated",
        result: value.event_name
    });
});

router.post('/:projectactivities_puuid/oauthclient/redirect_uri', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const value = await validateUpdateRedirectURI.validateAsync(await req.json());

    await projectactivities.oAuth.updateRedirectURL(param.projectactivities_puuid, value.event_redirect_uri);
    res.status(200);
    res.json({
        message: "OAuth Client Redirect URI Updated",
        result: value.event_redirect_uri
    });
});

router.post('/:projectactivities_puuid/oauthclient', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const value = await ValidateCreateOAuthApp.validateAsync(await req.json());

    const is_validScope = oAuthPermissions.validateCombInt(value.scope);
    if (!is_validScope) throw new InvalidRouteInput("Invalid Scope");

    const client_secret = randomstring.generate({
        length: 128,
        charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
    });

    const client_id = randomstring.generate({
        length: 64,
        charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
    });

    await projectactivities.oAuth.deleteTokens(param.projectactivities_puuid);
    await projectactivities.oAuth.createClient(param.projectactivities_puuid, value.name, client_id, client_secret, value.redirect_uri, value.scope)

    res.status(200);
    res.json({
        message: "OAuth Client Created",
        result: {
            client_id: client_id,
            client_secret: client_secret,
            name: value.name,
            redirect_uri: value.redirect_uri,
            scope: value.scope
        }
    });
});

router.delete('/:projectactivities_puuid/oauthclient', verifyRequest('web.event.oauth.write'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    await projectactivities.oAuth.deleteClient(param.projectactivities_puuid);
    res.status(200);
    res.json({
        message: "OAuth Client Deleted"
    });
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};