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

const oAuthAccsessTokenShema = Joi.object({
    access_token: Joi.string().alphanum().required(),
});

//console.log(oAuthPermissions.genPermission(["USER:ID:READ", "USER:USERNAME:READ", "USER:EMAIL:READ", "USER:REALNAME:READ", "USER:BIO:READ", "USER:AVATAR:READ", "USER:GROUP:READ", "USER:ADDRESS:READ", "SETTINGS:DESIGN:READ", "SETTINGS:LANG:READ", "EVENTS:LIST:READ", "PROJECTS:LIST:READ", "INTEGRATION:TELEGRAM:READ"]))

router.get('/', verifyRequest('app.web.login'), limiter(10), async (req, res) => {
    const { client_id, scope } = await OAuthRequestShema.validateAsync(req.query);
    const user_id = req.user.user_id;

    const oAuthClientResponse = await oAuth.get_client(client_id, scope, user_id)

    const has_authorized = await oAuth.has_authorized(client_id, user_id);
    if (has_authorized) {
        const code = randomstring.generate(128);

        await oAuthSession.addSession(code, { "user_id": user_id, "oAuthApp_id": oAuthClientResponse.id });

        res.json({
            redirect_uri: oAuthClientResponse.redirect_url,
            code: code
        });
    }

    res.json({
        name: oAuthClientResponse.name,
        avatar_url: oAuthClientResponse.avatar_url,
        permissions: oAuthPermissions.listPermissionsTranslation(scope)
    });
});

router.post('/', verifyRequest('app.web.login'), limiter(10), async (req, res) => {
    const { client_id, scope } = await OAuthRequestShema.validateAsync(await req.json());
    const user_id = req.user.user_id;

    const oAuthClientResponse = await oAuth.get_client(client_id, scope, user_id)

    const code = randomstring.generate(128);

    await oAuthSession.addSession(code, { "user_id": user_id, "oAuthApp_id": oAuthClientResponse.id });

    res.json({
        redirect_uri: oAuthClientResponse.redirect_url,
        code: code
    });
});

router.post('/authorize', limiter(10), async (req, res) => {
    const { code } = await oAuthSubmitShema.validateAsync(await req.json());

    const session_data = await oAuthSession.getSession(code);

    if (!session_data) {
        throw new OAuthError("Invalid code").withInfo("The code is invalid or has expired");
    }

    const sql_response = await oAuth.o_authTokens(session_data.oAuthApp_id, session_data.user_id);

    res.json({ access_token: sql_response.access_token, refresh_token: sql_response.refresh_token });
});

router.get('/user', limiter(10), async (req, res) => {
    const { access_token } = await oAuthAccsessTokenShema.validateAsync(req.query);

    const sql_response = await oAuth.get_authorized_data(access_token);

    res.json(sql_response);
});

module.exports = router;