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

const NewEventCheck = Joi.object({
    eventName: Joi.fullysanitizedString().min(3).max(128).required(),
    color: Joi.string().valid(...avaiableColors).required(),
    minGroup: Joi.string().valid(...[default_group, default_member_group]).required(),
    visibility: Joi.number().min(0).max(1).required(),
    dateApply: Joi.date().required(),
    dateStart: Joi.date().required(),
    dateEnd: Joi.date().required(),
    location: Joi.fullysanitizedString().min(3).max(256).required(),
    description: Joi.sanitizedString().min(3).max(2048).required()
});

const ValidateUUID = Joi.object({
    id: Joi.string().uuid().required()
});

const ValidateEventName = Joi.object({
    name: Joi.fullysanitizedString().min(3).max(128).required()
});

const ValidateEventColor = Joi.object({
    color: Joi.string().valid(...avaiableColors).required()
});

const ValidateEventMinGroup = Joi.object({
    minGroup: Joi.string().valid(...[default_group, default_member_group]).required()
});

const ValidateEventVisibility = Joi.object({
    visibility: Joi.number().min(0).max(1).required()
});

const ValidateEventDateApply = Joi.object({
    dateApply: Joi.date().required()
});

const ValidateEventDateStart = Joi.object({
    dateStart: Joi.date().required()
});

const ValidateEventDateEnd = Joi.object({
    dateEnd: Joi.date().required()
});

const ValidateEventLocation = Joi.object({
    location: Joi.fullysanitizedString().min(3).max(256).required()
});

const ValidateEventDescription = Joi.object({
    description: Joi.sanitizedString().min(3).max(2048).required()
});

const ValidateAnnounceCreation = Joi.object({
    type: Joi.string().valid('text').required(),
    announce: Joi.sanitizedString().min(3).max(4096).required()
});

const ValidateAnnounceDeleteion = Joi.object({
    id: Joi.string().uuid().required(),
    timestamp: Joi.number().integer().min(0).required()
});

router.get('/count', verifyRequest('web.event.get.count.read'), limiter(), async (req, res) => {
    const value = await pageCountCheck.validateAsync(req.query);
    const amount = await projectactivities.event.GetCount(value.search, new Date());
    res.status(200);
    res.json(amount);
});

router.get('/', verifyRequest('web.event.get.eventlist.read'), limiter(), plublicStaticCache(60_000, ["query", "user.user_id"], "public_event_index"), async (req, res) => {
    const value = await pageCheck.validateAsync(req.query);
    const events = await projectactivities.event.GetByPage(Number(value.page) - 1, value.size, req.user.user_id, value.search, new Date());
    res.status(200);
    res.json(events);
});

router.get('/:id', verifyRequest('web.event.get.read'), limiter(), plublicStaticCache(60_000, ["params", "user.user_id"], "public_event_:id"), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const event_data = await projectactivities.event.getDetails(value.id, req.user.user_id);
    if (event_data.length === 0) throw new DBError('Event.Get', 1, typeof 1, event_data.length, typeof event_data.length);
    if (event_data[0].avatar_url === "" || event_data[0].avatar_url === null) event_data[0].avatar_url = "/i/e";
    res.status(200);
    res.json(event_data[0]);
});

router.post('/', verifyRequest('web.event.create.write'), limiter(), async (req, res) => {
    const value = await NewEventCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');
    const { eventName, color, minGroup, visibility, dateApply, dateStart, dateEnd, location, description } = value;

    // Check if the apply date is before the start date, and the start date is before the end date
    if (dateApply > dateStart) throw new InvalidRouteJson('NewEventApplyBeforeStart');
    if (dateStart > dateEnd) throw new InvalidRouteJson('NewEventEndBeforeStart');

    const minDefaultGroup = getNextLowerDefaultGroup(req.user.user_group);

    if (minDefaultGroup === default_group && minGroup !== minDefaultGroup) {
        throw new InvalidRouteJson('InvalidMinGroupForDefaultGroup');
    }

    await writeOverwriteCacheKey("public_event_index");

    const event_response = await projectactivities.event.create(eventName, description, '', color, location, dateStart, dateEnd, dateApply, minGroup, visibility, 0, req.user.user_id);

    res.status(200);
    res.json({
        puuid: event_response,
    });
});

router.post('/:id/join', verifyRequest('web.event.join.write'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const sql_response = await projectactivities.event.join(params.id, req.user.user_id, req.user.user_group);
    if (sql_response instanceof CustomError) throw sql_response;
    if (sql_response.rowCount !== 1) throw new DBError('Event.Join', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Joined event"
    });
});

router.post('/:id/leave', verifyRequest('web.event.leave.read'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const sql_response = await projectactivities.event.leave(params.id, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Leave', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Left event"
    });
});

// Settings
router.post('/:id/name', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const name = await ValidateEventName.validateAsync(await req.json());
    if (!name) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.name(params.id, name.name);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Name', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Name changed",
        name: params.name
    });
});

router.post('/:id/color', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const color = await ValidateEventColor.validateAsync(await req.json());
    if (!color) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.color(params.id, color.color);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Color', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Color changed",
        color: params.color
    });
});

router.post('/:id/mingroup', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const minGroup = await ValidateEventMinGroup.validateAsync(await req.json());

    const minDefaultGroup = getNextLowerDefaultGroup(req.user.user_group);

    if (minDefaultGroup === default_group && minGroup.minGroup !== minDefaultGroup) {
        throw new InvalidRouteJson('InvalidMinGroupForDefaultGroup');
    }

    const sql_response = await projectactivities.event_update.min_group(params.id, minGroup.minGroup);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.MinGroup', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "MinGroup changed",
        mingroup: params.minGroup
    });
});

router.post('/:id/visibility', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const visibility = await ValidateEventVisibility.validateAsync(await req.json());
    if (!visibility) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.visibility(params.id, visibility.visibility);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Visibility', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Visibility changed",
        visibility: params.visibility
    });
});

router.post('/:id/dateapply', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const dateApply = await ValidateEventDateApply.validateAsync(await req.json());
    if (!dateApply) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_apply(params.id, dateApply.dateApply);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateApply', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is before the start date');
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "DateApply changed",
        dateapply: params.dateApply
    });
});

router.post('/:id/datestart', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const dateStart = await ValidateEventDateStart.validateAsync(await req.json());
    if (!dateStart) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_start(params.id, dateStart.dateStart);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateStart', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is after end date');
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Datestart changed",
        datestart: params.dateStart
    });
});

router.post('/:id/dateend', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const dateEnd = await ValidateEventDateEnd.validateAsync(await req.json());
    if (!dateEnd) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_end(params.id, dateEnd.dateEnd);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateEnd', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is before start date');
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "DateEnd changed",
        dateend: params.dateEnd
    });
});

router.post('/:id/location', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const location = await ValidateEventLocation.validateAsync(await req.json());
    if (!location) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.location_address(params.id, location.location);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Location', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Location changed",
        location: params.location
    });
});

router.post('/:id/description', verifyRequest('web.event.update.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const description = await ValidateEventDescription.validateAsync(await req.json());
    if (!description) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.description(params.id, description.description);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Description', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.status(200);
    res.json({
        message: "Description changed",
        description: params.description
    });
});

router.post('/:id/avatar', verifyRequest('web.event.avatar.write'), verifyOwner('id', 'PA'), limiter(30), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const busboy = Busboy({ headers: req.headers });
    const fileName = `ea:${params.id}.jpg`;

    const passThrough = new PassThrough();

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        file.pipe(passThrough);
    });

    req.pipe(busboy);

    const file_buffer = await streamToBuffer(passThrough);
    const isJPG = await verifyBufferIsJPG(file_buffer, 1024, 1024);

    if (!isJPG) throw new CustomError('Invalid Image');

    try {
        await minioClient.putObject(process.env.S3_WEB_BUCKET, fileName, file_buffer);
    } catch (err) {
        throw new S3ErrorWrite(err, process.env.S3_WEB_BUCKET, fileName);
    }

    const sql_response = await projectactivities.event_update.avatar(params.id, `/i/e/${params.id}`);
    if (sql_response.rowCount !== 1) {
        throw new DBError('Event.Update.Avatar', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    }

    await writeOverwriteCacheKey("public_event_:id", { id: params.id });
    await writeOverwriteCacheKey("public_event_index");

    res.json({
        message: 'Avatar uploaded',
        fileName: `/i/e/${params.id}`,
    });
});

router.delete('/:id/avatar', verifyRequest('web.event.avatar.write'), verifyOwner('id', 'PA'), limiter(10), async (req, res) => {
    const params = await ValidateUUID.validateAsync(req.params);
    const sql_response = await projectactivities.event_update.avatar(params.id, `/i/e`);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Avatar', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    minioClient.removeObjects(process.env.S3_WEB_BUCKET, [`ea:${params.id}.jpg`], async (err) => {
        if (err) throw new S3ErrorRead(err);

        await writeOverwriteCacheKey("public_event_:id", { id: params.id });
        await writeOverwriteCacheKey("public_event_index");

        res.json({
            message: 'Avatar deleted',
            fileName: `/i/e`,
        });
    });
});

router.get('/:id/announce', verifyRequest('web.event.announce.read'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const announce = await projectactivities.event.get_announce(param.id);

    if (announce.length === 0) throw new DBError('Event.Announce.Get', 1, typeof 1, announce.length, typeof announce.length);

    res.status(200);
    res.json(announce);
});

router.post('/:id/announce', verifyRequest('web.event.announce.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const param = await ValidateUUID.validateAsync(req.params);
    const value = await ValidateAnnounceCreation.validateAsync(await req.json());

    await projectactivities.event.add_announce(param.id, value.type, value.announce);

    res.status(200);
    res.json({
        message: "Announcement Created",
    });
});

router.delete('/:id/announce/:timestamp', verifyRequest('web.event.announce.write'), verifyOwner('id', 'PA'), limiter(), async (req, res) => {
    const param = await ValidateAnnounceDeleteion.validateAsync(req.params);

    const sql_response = await projectactivities.event.del_announce(param.id, param.timestamp);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Announce.Remove', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);

    res.status(200);
    res.json({
        message: "Announcement Removed",
    });
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};