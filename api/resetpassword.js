const fs = require('node:fs');
const path = require('node:path');
const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const { RPW } = require('@lib/redis');
const HyperExpress = require('hyper-express');
const { getContextObject } = require('@lib/template');
const ejs = require('ejs');
const { InvalidRouteInput, DBError, RenderError } = require('@lib/errors');
const bcrypt = require('bcrypt');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'PasswortReset'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const ResetPasswordCheck = Joi.object({
    email: Joi.string().email().required()
});

const CheckURLPath = Joi.object({
    urlPath: Joi.string().alphanum().required()
});

const PasswordCheck = Joi.object({
    password: Joi.string().min(6).max(56).required(),
});

router.post('/', async (req, res) => {
    const value = await ResetPasswordCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if user exists in our database
    const user_responses = await user.getByUseridentifyer(value.email.toLowerCase());

    if (!user_responses || user_responses.length === 0) {
        // Send fake OK to prevent user enumeration
        process.log.debug(`User with email "${value.email}" not found`);
        res.json({ status: true });
    } else {
        const urlPath = generateUrlPath();

        // Send E-Mail Verification
        await sendMail('user:reset_password', { userId: user_responses[0].id, urlPath: urlPath, appDomain: process.env.DOMAIN }, false);
    }

    res.json({ status: true });
});

router.get('/:urlPath', async (req, res) => {
    const value = await CheckURLPath.validateAsync(req.params);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if the URLPath exists
    const exists = await RPW.check(value.urlPath);
    if (!exists) throw new InvalidRouteInput('Invalid Route Input');

    ejs.renderFile(path.join(__dirname, '..', 'views', 'auth', 'reset-password.ejs'), { params: req.params, ...getContextObject() }, (err, str) => {
        if (err) throw new RenderError("Rendering Error").setError(err);

        res.send(str);
    });
});

router.post('set/:urlPath', async (req, res) => {
    const value_req = await PasswordCheck.validateAsync(await req.json());
    const value_params = await CheckURLPath.validateAsync(req.params);
    if (!value_req && !value_params) throw new InvalidRouteInput('Invalid Route Input');

    // Check if the URLPath exists
    const exists = await RPW.check(value_params.urlPath);
    if (!exists) throw new InvalidRouteInput('Invalid Route Input');

    const { userId } = await RPW.get(value_params.urlPath);
    const password_hash = await bcrypt.hash(value_req.password, parseInt(process.env.SALTROUNDS));
    
    const dbUpdate_result = await user.update.password(userId, password_hash);
    if (dbUpdate_result.rowCount === 0) throw new DBError('User.updatePassword', 0, typeof 0, dbUpdate_result.rowCount, typeof dbUpdate_result.rowCount);
    
    await RPW.delete(value_params.urlPath);


    res.json({ status: true });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};