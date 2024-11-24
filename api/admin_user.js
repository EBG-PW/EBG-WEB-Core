const Joi = require('joi');
const { admin } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { delWebtoken } = require('@lib/cache');
const { sendMail } = require('@lib/queues');
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

router.get('/count', verifyRequest('app.admin.usermgm.users'), limiter(), async (req, res) => {
    const value = await pageCountCheck.validateAsync(req.query);
    const amount = await admin.users.count_total(value.search);
    res.status(200);
    res.json(amount);
});

router.get('/', verifyRequest('app.admin.usermgm.users'), limiter(), async (req, res) => {
    const value = await pageCheckDataTable.validateAsync(req.query);
    const users = await admin.users.get_page(Number(value.page) - 1, value.size, value.search, value.sort, value.order);
    res.status(200);
    res.json(users);
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};