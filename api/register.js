const fs = require('node:fs');
const path = require('node:path');
const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { mergePermissions, checkPermission } = require('@lib/permission');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const { checkCTRexists } = require('@lib/redis');
const HyperExpress = require('hyper-express');
const { default_group } = require('@config/permissions');
const { InvalidRouteInput, InvalidRegister, DBError } = require('@lib/errors');
const bcrypt = require('bcrypt');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'Register'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const RegisterCheck = Joi.object({
    username: Joi.string().alphanum().min(1).max(56).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(56).required(),
    language: Joi.string().pattern(/^[a-zA-Z]{2,}(-[a-zA-Z]{2,})?$/).required(),
    legal: Joi.boolean().required().valid(true)
});

const CheckURLPath = Joi.object({
    urlPath: Joi.string().alphanum().required()
});

router.post('/', async (req, res) => {
    const value = await RegisterCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Get Password Hash;
    const password_hash = await bcrypt.hash(value.password, parseInt(process.env.SALTROUNDS));

    // Add User to Database
    const userId = await user.create(value.username, value.email, password_hash, value.language.split('-')[0], 'white.center', default_group, null, null, null, null).catch((err) => {
        if (err.code === '23505') {
            throw new InvalidRegister('User already exists');
        }
    });

    const urlPath = generateUrlPath();

    // Send E-Mail Verification
    await sendMail('user:email_verification', {userId: userId, urlPath: urlPath, appDomain: process.env.DOMAIN}, false);

    res.json({ urlPath: urlPath });
});

router.get('/:urlPath', async (req, res) => {
    const value = await CheckURLPath.validateAsync(req.params);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if the URLPath exists
    const exists = await checkCTRexists(value.urlPath);
    if (!exists) throw new InvalidRouteInput('Invalid Route Input');

    res.send(fs.readFileSync(path.join(__dirname, '..', 'public', 'auth', 'sign-up-verify.html')));
    
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};