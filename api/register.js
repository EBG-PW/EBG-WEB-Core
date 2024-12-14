const fs = require('node:fs');
const path = require('node:path');
const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const { CTR } = require('@lib/redis');
const HyperExpress = require('hyper-express');
const { getContextObject } = require('@lib/template');
const ejs = require('ejs');
const { default_group } = require('@config/permissions');
const { InvalidRouteInput, InvalidRegister, DBError, RenderError } = require('@lib/errors');
const bcrypt = require('bcrypt');
const { limiter } = require('@middleware/limiter');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'Register'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const RegisterCheck = Joi.object({
    username: Joi.string().alphanum().min(1).max(56).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(56).required(),
    language: Joi.string().pattern(/^[a-zA-Z]{2,8}(-[a-zA-Z]{2,8})?$/).required(),
    legal: Joi.boolean().required().valid(true)
});

const CheckURLPath = Joi.object({
    urlPath: Joi.string().alphanum().required()
});

router.post('/', limiter(20), async (req, res) => {
    const value = await RegisterCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Get Password Hash;
    const password_hash = await bcrypt.hash(value.password, parseInt(process.env.SALTROUNDS));

    // Add User to Database
    const userId = await user.create(value.username, value.email.toLowerCase(), password_hash, value.language.split('-')[0], 'white.center', default_group, null, null, null, null).catch((err) => {
        if (err.code === '23505') {
            throw new InvalidRegister('User already exists');
        }
        throw new Error(err);
    });

    const urlPath = generateUrlPath();

    // Send E-Mail Verification
    await sendMail('user:email_verification', { userId: userId, urlPath: urlPath, appDomain: process.env.DOMAIN }, false);

    res.json({ status: true });
});

router.get('/:urlPath', limiter(20), async (req, res) => {
    const value = await CheckURLPath.validateAsync(req.params);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if the URLPath exists
    const exists = await CTR.check(value.urlPath);
    if (!exists) throw new InvalidRouteInput('Invalid Route Input');

    let cookie_language = req.cookies.language || process.env.FALLBACKLANG;
    // Check if cookie language is listed in process.countryConfig { de: 'Deutsch', en: 'English' }
    if (!process.countryConfig[cookie_language]) {
        process.log.warn(`Cookie language not found: ${cookie_language}`);
        cookie_language = process.env.FALLBACKLANG;
    }

    ejs.renderFile(path.join(__dirname, '..', 'views', 'auth', 'sign-up-verify.ejs'), { params: req.params, language: process.availableLanguages[cookie_language], ...getContextObject() }, (err, str) => {
        if (err) throw new RenderError("Rendering Error").setError(err);

        res.send(str);
    });
});

router.post('/:urlPath/verify', limiter(20), async (req, res) => {
    const value = await CheckURLPath.validateAsync(req.params);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if the URLPath exists
    const exists = await CTR.check(value.urlPath);
    if (!exists) throw new InvalidRouteInput('Invalid Route Input');

    const { userId } = await CTR.get(value.urlPath);

    const dbUpdate_result = await user.update.verifyEmail(userId);
    if (dbUpdate_result.rowCount === 0) throw new DBError('User.verifyEmail', 0, typeof 0, dbUpdate_result.rowCount, typeof dbUpdate_result.rowCount);

    await CTR.delete(value.urlPath);


    res.json({ verified: true });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};