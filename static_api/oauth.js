const Joi = require('joi');
const { oAuth } = require('@lib/postgres');
const { oAuthSession } = require('@lib/redis');
const oAuthPermissions = require('@lib/oauth/permissions');
const randomstring = require('randomstring');
const HyperExpress = require('hyper-express');
const { PermissionsError, InvalidRouteInput, OAuthError, DBError, InvalidLogin } = require('@lib/errors');
const useragent = require('express-useragent');
const router = new HyperExpress.Router();
const auth_config = require('@config/auth');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');

const OAuthRequestShema = Joi.object({
    client_id: Joi.string().alphanum().required(),
    scope: Joi.number().required(),
});

const oAuthSubmitShema = Joi.object({
    code: Joi.string().alphanum().required(),
});

//console.log(oAuthPermissions.genPermission(["USER:ID:READ", "USER:USERNAME:READ", "USER:EMAIL:READ", "USER:REALNAME:READ", "USER:BIO:READ", "USER:AVATAR:READ", "USER:GROUP:READ", "USER:ADRESS:READ", "SETTINGS:DESIGN:READ", "SETTINGS:LANG:READ", "EVENTS:LIST:READ", "PROJECTS:LIST:READ"]))

router.get('/', verifyRequest('app.web.login'), limiter(10), async (req, res) => {
    const { client_id, scope } = await OAuthRequestShema.validateAsync(req.query);
    const user_id = req.user.user_id;

    const oAuthClientResponse = await oAuth.get_client(client_id, scope, user_id)

    res.json({
        name: oAuthClientResponse.name,
        avatar_url: oAuthClientResponse.avatar_url,
        permissions: oAuthPermissions.listPermissionsTranslation(scope)
    });
});

module.exports = router;