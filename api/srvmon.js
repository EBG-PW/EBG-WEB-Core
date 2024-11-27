const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { verifyOwner } = require('@middleware/verifyOwner');
const { projectactivities } = require('@lib/postgres');
const HyperExpress = require('hyper-express');
const { writeOverwriteCacheKey } = require('@lib/cache');
const { InvalidRouteJson, DBError, InvalidRouteInput, CustomError, S3ErrorWrite, S3ErrorRead } = require('@lib/errors');
const { streamToBuffer, verifyBufferIsJPG } = require('@lib/utils');
const { plublicStaticCache } = require('@middleware/cacheRequest');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const { default_group, default_member_group } = require('@config/permissions');
const router = new HyperExpress.Router();

const Busboy = require('busboy');
const { PassThrough } = require('stream');
const Minio = require('minio');
const { hostname } = require('os');

// Initialize MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.S3_WEB_ENDPOINT,
    port: parseInt(process.env.S3_WEB_PORT),
    useSSL: process.env.S3_WEB_USESSL === 'true',
    accessKey: process.env.S3_WEB_ACCESSKEY,
    secretKey: process.env.S3_WEB_SECRETKEY
});

/* Plugin info*/
const PluginName = 'Events'; //This plugins name
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

router.post('/', verifyRequest('app.service.srvmon.write'), limiter(), async (req, res) => {
    const value = await NewSRVMonCheck.validateAsync(await req.json());
    console.log(value);
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