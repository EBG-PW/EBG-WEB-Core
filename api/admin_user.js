const Joi = require('joi');
const { admin } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { delWebtoken } = require('@lib/cache');
const HyperExpress = require('hyper-express');
const bcrypt = require('bcrypt');
const { PassThrough } = require('stream');
const { InvalidRouteInput, DBError, InvalidLogin, CustomError, S3ErrorWrite, S3ErrorRead, } = require('@lib/errors');
const router = new HyperExpress.Router();


/* Plugin info*/
const PluginName = 'Admin_User'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const pageCheckDataTable = Joi.object({
    search: Joi.string().allow('').default(''),
    sort: Joi.string().allow('').default(''),
    order: Joi.string().allow('').default('asc'),
    page: Joi.number().min(0).max(32000).default(0),
    size: Joi.number().min(0).max(50).default(10)
});

const pageCountCheck = Joi.object({
    search: Joi.string().allow('').default('')
});

const validateUUID = Joi.object({
    puuid: Joi.string().uuid().required()
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

const UserGroupCheck = Joi.object({
    user_group: Joi.string().valid(...Object.keys(process.permissions_config.groups)).required(),
});

router.get('/count', verifyRequest('app.admin.usermgm.users.read'), limiter(), async (req, res) => {
    const query = await pageCountCheck.validateAsync(req.query);
    const amount = await admin.users.count_total(query.search);
    res.status(200);
    res.json(amount);
});

router.get('/', verifyRequest('app.admin.usermgm.users.read'), limiter(), async (req, res) => {
    const query = await pageCheckDataTable.validateAsync(req.query);
    const users = await admin.users.get_page(Number(query.page) - 1, query.size, query.search, query.sort, query.order);
    res.status(200);
    res.json(users);
});

router.get('/:puuid', verifyRequest('app.admin.usermgm.users.read'), limiter(), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const user_responses = await admin.users.get_by_uuid(params.puuid);
    if (!user_responses || user_responses.length === 0) throw new InvalidRouteInput('Unknown User');

    const user_response = user_responses[0];

    res.status(200);
    res.json({
        username: user_response.username,
        avatar_url: user_response.avatar_url,
        email: user_response.email,
        first_name: user_response.first_name,
        last_name: user_response.last_name,
        bio: user_response.bio,
        user_group: user_response.user_group,
    });
});

router.post('/:puuid/username', verifyRequest('app.admin.username.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await UsernameCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await admin.users.update.username(params.puuid, body.username);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Username', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    // Flush the cache
    await delWebtoken(req.authorization);

    res.status(200);
    res.json({
        message: 'Username changed',
        username: body.username,
    });
});

router.post('/:puuid/email', verifyRequest('app.admin.email.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await EmailCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await admin.users.update.email(params.puuid, body.email);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Email', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Email changed',
        email: body.email,
    });
});

router.post('/:puuid/firstname', verifyRequest('app.admin.firstname.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await FirstNameCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await admin.users.update.first_name(params.puuid, body.first_name);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.FirstName', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'First name changed',
        first_name: body.first_name,
    });
});

router.post('/:puuid/lastname', verifyRequest('app.admin.lastname.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await LastNameCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await admin.users.update.last_name(params.puuid, body.last_name);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.LastName', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Last name changed',
        last_name: body.last_name,
    });
});

router.post('/:puuid/bio', verifyRequest('app.admin.bio.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await BioCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await admin.users.update.bio(params.puuid, body.bio);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.Bio', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'Bio changed',
        bio: body.bio,
    });
});

router.post('/:puuid/user_group', verifyRequest('app.admin.usergroup.write'), limiter(10), async (req, res) => {
    const params = await validateUUID.validateAsync(req.params);
    const body = await UserGroupCheck.validateAsync(await req.json());
    if (!body) throw new InvalidRouteInput('Invalid Route Input');

    // ADD Cache stuff to flush the cache for the user modified

    const sql_response = await admin.users.update.user_group(params.puuid, body.user_group);
    if (sql_response.rowCount !== 1) throw new DBError('User.Update.user_group', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: 'User_group changed',
        bio: body.user_group,
    });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};