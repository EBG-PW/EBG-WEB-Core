const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { addWebtoken, delWebtoken } = require('@lib/cache');
const { mergePermissions, checkPermission } = require('@lib/permission');
const { verifyRequest } = require('@middleware/verifyRequest');
const HyperExpress = require('hyper-express');
const { PermissionsError, InvalidRouteInput, InvalidLogin, Invalid2FA, DBError } = require('@lib/errors');
const useragent = require('express-useragent');
const twofactor = require("node-2fa");
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'Login'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const LoginCheck = Joi.object({
    identifyer: Joi.string().required(),
    password: Joi.string().required()
});

const Login2FACheck = Joi.object({
    client2fa: Joi.number().required(),
    user_id: Joi.number().required(),
    fa_token: Joi.string().required()
});

router.post('/', async (req, res) => {
    const value = await LoginCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if user exists in our database
    const user_response = await user.getByUseridentifyer(value.identifyer);
    if (!user_response || user_response.length === 0) throw new InvalidLogin('Invalid Login');

    // Compare passwort hash with passwort to check if they match
    const bcrypt_response = await bcrypt.compare(value.password, user_response[0].password);
    if (!bcrypt_response) throw new InvalidLogin('Invalid Login');;

    // Ceck if user has 2FA enabled
    if (user_response[0].twofa_secret !== null) {
        // Generate a random token, so we can check if the user who loged in also entered the 2FA code
        const FA_Token = randomstring.generate({
            length: process.env.WebTokenLength, //DO NOT CHANCE!!!
            charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
        });

        // Set time of login, so we can know how long the user had enterd the 2FA code. If its too long, we force him to login again
        const twofa_time_response = await user.update.twofa_time(value.username, FA_Token, new Date());
        if (twofa_time_response.rowCount === 1) throw new DBError('User.Update.TwoFATime', 1, typeof 1, twofa_time_response.rowCount, typeof twofa_time_response.rowCount);

        res.status(200)
        res.json({
            message: '2FA required',
            user_id: user_response[0].id,
            username: user_response[0].username,
            language: user_response[0].language,
            design: user_response[0].design,
            FA_Token: FA_Token
        });
    } else {
        const source = req.headers['user-agent']
        const UserAgent = useragent.parse(source)

        const WebToken = randomstring.generate({
            length: process.env.WEBTOKENLENGTH, //DO NOT CHANCE!!!
            charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
        });

        const PermissionsResponse = await user.permission.get(user_response[0].id)
        const Formated_Permissions = mergePermissions(PermissionsResponse.rows, user_response[0].user_group); // Format the permissions to a array
        console.log(Formated_Permissions)
        const allowed = checkPermission(Formated_Permissions, 'app.web.login'); // Check if user has permissions to login
        if (!allowed.result) throw new PermissionsError('NoPermissions', 'app.web.login');

        const WebTokenResponse = await webtoken.create(user_response[0].id, user_response[0].username, WebToken, UserAgent.browser, user_response[0].language, user_response[0].design);
        if (WebTokenResponse.rowCount === 0) throw new DBError('Webtoken.Create', 0, typeof 0, WebTokenResponse.rowCount, typeof WebTokenResponse.rowCount);
        await addWebtoken(WebToken, user_response[0].user_id, user_response[0].username, Formated_Permissions, UserAgent.browser, user_response[0].language, user_response[0].design, new Date().getTime()); // Add the webtoken to the cache

        res.status(200)
        res.json({
            message: 'Login successful',
            user_id: user_response[0].id,
            username: user_response[0].username,
            language: user_response[0].language,
            design: user_response[0].design,
            token: WebToken,
            permissions: Formated_Permissions
        });
    }
});

router.post('/2fa', async (req, res) => {
    const value = await Login2FACheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Check if user exists in our database
    const user_response = await user.get(value.id);
    if (!user_response || user_response[0].length === 0) throw new InvalidLogin('Invalid Login');
    if (user_response[0].twofa_token !== value.fa_token) throw new Invalid2FA('Token is invalid');

    // Check if 2FA code is not expired
    if (new Date(user_response[0].twofa_time).getTime() + (process.env.Web2FAValidForMin * 1000 * 60) < Date.now()) new Invalid2FA('Token is invalid');

    // Check if 2FA code is valid
    const twofa_response = twofactor.verifyToken(user_response[0].twofa_secret, `${value.client2fa}`);
    if (!twofa_response) throw new Invalid2FA('Failed with calculation');
    if (twofa_response.delta !== 0) throw new Invalid2FA('Invalid user input');

    // Remove 2FA token from DB so nobody can use it again
    const twofa_time_response = await user.update.twofa_time(value.id, null);
    if (twofa_time_response.rowCount === 1) throw new DBError('Webtoken.Create', 1, typeof 1, twofa_time_response.rowCount, typeof twofa_time_response.rowCount);

    const source = req.headers['user-agent']
    const UserAgent = useragent.parse(source)

    const WebToken = randomstring.generate({
        length: process.env.WEBTOKENLENGTH, //DO NOT CHANCE!!!
        charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
    });

    const PermissionsResponse = await user.permission.get(user_response[0].id)

    const Formated_Permissions = mergePermissions(PermissionsResponse.rows, user_response[0].user_group); // Format the permissions to a array
    const allowed = checkPermission(Formated_Permissions, 'app.web.login'); // Check if user has permissions to login
    if (!allowed.result) throw new PermissionsError('NoPermissions', 'app.web.login');

    const WebTokenResponse = await webtoken.create(user_response[0].id, user_response[0].username, WebToken, UserAgent.browser, user_response[0].language, user_response[0].design);
    if (WebTokenResponse.rowCount === 0) throw new DBError('Webtoken.Create', 0, typeof 0, twofa_time_response.rowCount, typeof twofa_time_response.rowCount);
    await addWebtoken(WebToken, user_response[0].id, user_response[0].username, Formated_Permissions, UserAgent.browser, user_response[0].language, user_response[0].design, new Date().getTime()); // Add the webtoken to the cache

    res.status(200)
    res.json({
        message: 'Login successful',
        user_id: user_response[0].id,
        username: user_response[0].username,
        language: user_response[0].language,
        design: user_response[0].design,
        token: WebToken,
        permissions: Formated_Permissions
    });
});

router.post('/check', verifyRequest('app.web.login'), async (req, res) => {
    res.status(200)
    res.json({
        message: 'Login successful',
        user_id: user_response[0].user_id,
        username: user_response[0].username,
        language: user_response[0].language,
        design: user_response[0].design,
        token: WebToken,
        permissions: Formated_Permissions
    });
});     

router.post('/logout', verifyRequest('app.web.login'), async (req, res) => {
    const WebTokenResponse = await webtoken.delete(req.authorization); // Delete the webtoken from the database
    if (WebTokenResponse.rowCount === 0) new DBError('Webtoken.Create', 0, typeof 0, WebTokenResponse.rowCount, typeof WebTokenResponse.rowCount);
    delWebtoken(req.authorization); // Remove the webtoken from the cache
    res.status(200)
    res.json({
        message: 'Logout successful'
    });
});



module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};