const Joi = require('joi');
const { user } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { delWebtoken } = require('@lib/cache');
const HyperExpress = require('hyper-express');
const bcrypt = require('bcrypt');
const { InvalidRouteInput, DBError, InvalidLogin } = require('@lib/errors');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'User'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const LayoutCheck = Joi.object({
    design: Joi.string().valid('light.fluid', 'dark.fluid', 'light.center', 'dark.center').required(),
});

const LanguageCheck = Joi.object({
    language: Joi.string().valid(...Object.keys(process.countryConfig)).required(),
});

const PasswordCheck = Joi.object({
    old_password: Joi.string().min(0).max(56).required(),
    new_password: Joi.string().min(6).max(56).required(),
});

// Make sure there are no illigal caracter in the username that can be exploited
const UsernameCheck = Joi.object({
    username: Joi.string().min(3).max(32).pattern(/^[a-zA-Z0-9_]*$/).required(),
});

const EmailCheck = Joi.object({
    email: Joi.string().email().required(),
});

const FirstNameCheck = Joi.object({
    first_name: Joi.string().min(2).max(32).pattern(/^[a-zA-Z0-9_]*$/).required(),
});

const LastNameCheck = Joi.object({
    last_name: Joi.string().min(2).max(32).pattern(/^[a-zA-Z0-9_]*$/).required(),
});

const BioCheck = Joi.object({
    bio: Joi.string().min(0).max(512).pattern(/^[a-zA-Z0-9_ ,\.\-\'?!]*$/).required(),
});

const PublicCheck = Joi.object({
    public: Joi.boolean().required(),
});

// Validate likable accounts, so it needs to accept profile links, usernames and user ids
const LinkCheck = Joi.object({
    platform: Joi.string().valid(...Object.keys(process.linkableapps)).required(),
    value: Joi.string().min(1).pattern(/^[a-zA-Z0-9_]*$/).required(),
});


router.post('/layout', verifyRequest('web.user.layout.write'), limiter(10), async (req, res) => {
    const value = await LayoutCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.settings.updateDesign(req.user.user_id, value.design);
    if (sql_response.rowCount !== 1) throw new DBError('User.Settings.UpdateDesign', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    // Flush the cache
    await delWebtoken(req.authorization);

    res.status(200);
    res.json({
        message: 'Layout changed',
        design: value.design,
    });
});

router.post('/language', verifyRequest('web.user.language.write'), limiter(10), async (req, res) => {
    const value = await LanguageCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.settings.updateLanguage(req.user.user_id, value.language);
    if (sql_response.rowCount !== 1) throw new DBError('User.Settings.UpdateLanguage', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    // Flush the cache
    await delWebtoken(req.authorization);

    res.status(200);
    res.json({
        message: 'Language changed',
        language: value.language,
    });
});

router.post('/setpassword', verifyRequest('web.user.password.write'), limiter(10), async (req, res) => {
    const value = await PasswordCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const user_responses = await user.get(req.user.user_id)
    if (!user_responses || user_responses.length === 0) throw new InvalidLogin('Unknown User');
    const user_response = user_responses[0];

    if (user_response.password === null) { // <-- Check if user has a password, if not we skip this check (This can happen if the user used OAuth to register)

    }

    const bcrypt_response = await bcrypt.compare(value.old_password, user_response.password);
    if (!bcrypt_response) throw new InvalidLogin('Old password is wrong');

    const bcrypt_new_password = await bcrypt.hash(value.new_password, 10);
    const sql_response = await user.update.password(req.user.user_id, bcrypt_new_password);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Password', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Password changed',
    });
});

router.get('/', verifyRequest('web.user.settings.read'), limiter(2), async (req, res) => {
    const user_responses = await user.get(req.user.user_id);
    if (!user_responses || user_responses.length === 0) throw new InvalidRouteInput('Unknown User');

    const user_response = user_responses[0];

    res.status(200);
    res.json({
        username: user_response.username,
        email: user_response.email,
        first_name: user_response.first_name,
        last_name: user_response.last_name,
        bio: user_response.bio,
        public: user_response.public,
    });
});

router.post('/username', verifyRequest('web.user.username.write'), limiter(10), async (req, res) => {
    const value = await UsernameCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.username(req.user.user_id, value.username);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Username', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    // Flush the cache
    await delWebtoken(req.authorization);

    res.status(200);
    res.json({
        message: 'Username changed',
        username: value.username,
    });
});

router.post('/email', verifyRequest('web.user.email.write'), limiter(10), async (req, res) => {
    const value = await EmailCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.email(req.user.user_id, value.email);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Email', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Email changed',
        email: value.email,
    });
});

router.post('/firstname', verifyRequest('web.user.firstname.write'), limiter(10), async (req, res) => {
    const value = await FirstNameCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.first_name(req.user.user_id, value.first_name);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.FirstName', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'First name changed',
        first_name: value.first_name,
    });
});

router.post('/lastname', verifyRequest('web.user.lastname.write'), limiter(10), async (req, res) => {
    const value = await LastNameCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.last_name(req.user.user_id, value.last_name);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.LastName', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Last name changed',
        last_name: value.last_name,
    });
});

router.post('/bio', verifyRequest('web.user.bio.write'), limiter(10), async (req, res) => {
    const value = await BioCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.bio(req.user.user_id, value.bio);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Bio', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Bio changed',
        bio: value.bio,
    });
});

router.post('/public', verifyRequest('web.user.public.write'), limiter(10), async (req, res) => {
    const value = await PublicCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.public(req.user.user_id, !value.public);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Public', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Public changed',
        public: value,
    });
});

router.delete('/avatar', verifyRequest('web.user.delete'), limiter(10), async (req, res) => {
    const sql_response = await user.update.avatar(req.user.user_id, null);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Avatar', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Avatar deleted',
    });
});

router.get('/links', verifyRequest('web.user.links.read'), limiter(2), async (req, res) => {
    const sql_response = await user.getlinks(req.user.user_id);
    if (!sql_response) throw new DBError('User.Get.Links', 1, typeof 1, sql_response, typeof sql_response);

    res.status(200);
    res.json({
        links: sql_response,
    });
});

router.post('/links', verifyRequest('web.user.links.write'), limiter(10), async (req, res) => {
    const value = await LinkCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.update.link(req.user.user_id, value.platform, value.value);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Link', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Link changed',
        platform: value.platform,
        link: value.link,
    });
});

router.delete('/links/:platform', verifyRequest('web.user.links.delete'), limiter(10), async (req, res) => {
    const sql_response = await user.delete.link(req.user.user_id, req.params.platform);
    if (sql_response.rowCount !== 1) throw new DBError('User.Delete.Link', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Link deleted',
        platform: req.params.platform,
    });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};