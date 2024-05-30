const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { addWebtoken } = require('@lib/cache');
const { OAUTH } = require('@lib/redis');
const { mergePermissions, checkPermission } = require('@lib/permission');
const randomstring = require('randomstring');
const HyperExpress = require('hyper-express');
const { PermissionsError, InvalidRouteInput, OAuthError, DBError, InvalidLogin } = require('@lib/errors');
const useragent = require('express-useragent');
const router = new HyperExpress.Router();
const auth_config = require('@config/auth');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const ejs = require('ejs');
const { limiter } = require('@middleware/limiter');

const OAuthRequestShema = Joi.object({
    client_id: Joi.string().alphanum().required(),
    scope: Joi.number().required(),
});

const oAuthSubmitShema = Joi.object({
    code: Joi.string().alphanum().required(),
});

router.get('/', verifyRequest('app.web.login'), limiter(10), async (req, res) => {
    const { client_id, scope } = await OAuthRequestShema.validateAsync(req.query);

    

    const user_id = req.session.user_id;
    const code = randomstring.generate(32);
    await OAUTH.set(code, JSON.stringify({ client_id, user_id, scope }), 'EX', 300);
    res.render('oauth', { client, code });
});