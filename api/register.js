const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { addWebtoken, logoutWebtoken } = require('@lib/cache');
const { mergePermissions, checkPermission } = require('@lib/permission');
const { verifyRequest } = require('@middleware/verifyRequest');
const { sendMail } = require('@lib/queues');
const HyperExpress = require('hyper-express');
const { default_group } = require('@config/permissions');
const { PermissionsError, InvalidRouteInput, InvalidRegister, Invalid2FA, DBError } = require('@lib/errors');
const useragent = require('express-useragent');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
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

router.post('/', async (req, res) => {
    const value = await RegisterCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Get Password Hash;
    const password_hash = await bcrypt.hash(value.password, parseInt(process.env.SALTROUNDS));

    // Add User to Database
    const userId = await user.create(value.username, value.email, password_hash, value.language, 'white.center', default_group, null, null, null, null).catch((err) => {
        if (err.code === '23505') {
            throw new InvalidRegister('User already exists');
        }
    });

    // Send E-Mail Verification
    sendMail('user:email_verification', userId, false);

    res.json({ success: true });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};