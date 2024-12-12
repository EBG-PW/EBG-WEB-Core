const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { verifyOwner } = require('@middleware/verifyOwner');
const HyperExpress = require('hyper-express');
const { Netdata } = require('@lib/redis');
const { InvalidRouteJson, DBError, InvalidRouteInput, CustomError, S3ErrorWrite, S3ErrorRead } = require('@lib/errors');
const { streamToBuffer, verifyBufferIsJPG } = require('@lib/utils');
const { plublicStaticCache } = require('@middleware/cacheRequest');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const { srvmon } = require('@lib/postgres');
const { default_group, default_member_group } = require('@config/permissions');
const router = new HyperExpress.Router();

const { PassThrough } = require('stream');

/* Plugin info*/
const PluginName = 'SRVMon_Netdata'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const avaiableColors = [
    'dark',
    'white',
    'blue',
    'azure',
    'indigo',
    'purple',
    'pink',
    'red',
    'orange',
    'yellow',
    'lime'
];

const pageCheck = Joi.object({
    search: Joi.string().allow('').default(''),
    page: Joi.number().min(0).max(32000).default(0),
    size: Joi.number().min(0).max(50).default(10)
});

const pageCountCheck = Joi.object({
    search: Joi.string().allow('').default('')
});

const NewSRVMonCheck = Joi.object({
    chartscope: Joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required(),
    hostname: Joi.fullysanitizedString().hostname().required(),
    ipaddr: Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'forbidden' }).required(),
    color: Joi.string().valid(...avaiableColors).required(),
    visibility: Joi.number().min(0).max(1).required(),
    charttime: Joi.number().min(1).max(48).default(1),
});

router.get('/count', verifyRequest('app.service.srvmon.read'), limiter(), async (req, res) => {
    const query = await pageCountCheck.validateAsync(req.query);
    const amount = await srvmon.countByID(req.user.user_id, query.search);
    res.status(200);
    res.json(amount);
});

router.get('/', verifyRequest('app.service.srvmon.read'), limiter(), async (req, res) => {
    const query = await pageCheck.validateAsync(req.query);
    const monitors = await srvmon.getByID(req.user.user_id, Number(query.page) - 1, query.size, query.search);
    const monitor_data = await Netdata.getOverviews(monitors);
    res.status(200);
    res.json(monitor_data);
});

router.post('/', verifyRequest('app.service.srvmon.write'), limiter(), async (req, res) => {
    const body = await NewSRVMonCheck.validateAsync(await req.json());
    await srvmon.create(body.ipaddr, req.user.user_id, body.hostname, body.charttime, body.chartscope);
    res.status(200);
    res.json({
        status: 'ok'
    });
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};