const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { projectactivities } = require('@lib/postgres');
const HyperExpress = require('hyper-express');
const { InvalidRouteJson, DBError, InvalidRouteInput } = require('@lib/errors');
const { plublicStaticCache } = require('@middleware/cacheRequest');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const { default_group, default_member_group } = require('@config/permissions');
const router = new HyperExpress.Router();

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

router.get('/count', verifyRequest('web.event.get.count.read'), limiter(), async (req, res) => {
    const value = await pageCountCheck.validateAsync(req.query);
    const amount = await projectactivities.GetCount(value.search, new Date());
    res.status(200);
    res.json(amount);
});

router.get('/', verifyRequest('web.event.get.events.read'), plublicStaticCache(60_000, ["query"]), limiter(), async (req, res) => {
    const value = await pageCheck.validateAsync(req.query);
    console.log(req.user)
    const events = await projectactivities.GetByPage(Number(value.page) - 1, value.size, req.user.user_id, value.search, new Date());
    res.status(200);
    res.json(events);
});

router.get('/:id', verifyRequest('web.event.get.event.read'), plublicStaticCache(60_000, ["params", "user.user_id"]), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const event_data = await projectactivities.event.getDetails(value.id, req.user.user_id);
    res.status(200);
    res.json(event_data[0]);
});

router.post('/', verifyRequest('web.event.create.event.write'), limiter(), async (req, res) => {
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

    const event_response = await projectactivities.create(eventName, description, '', color, location, dateStart, dateEnd, dateApply, minGroup, visibility, 0, req.user.user_id);

    res.status(200);
    res.json({
        puuid: event_response,
    });
});

// Settings
router.post('/:id/name', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const name = await ValidateEventName.validateAsync(await req.json());
    if (!name) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.name(value.id, name.name, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Name', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "Name changed",
        name: value.name
    });
});

router.post('/:id/color', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const color = await ValidateEventColor.validateAsync(await req.json());
    if (!color) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.color(value.id, color.color, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Color', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "Color changed",
        color: value.color
    });
});

router.post('/:id/mingroup', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const minGroup = await ValidateEventMinGroup.validateAsync(await req.json());

    const minDefaultGroup = getNextLowerDefaultGroup(req.user.user_group);

    if (minDefaultGroup === default_group && minGroup.minGroup !== minDefaultGroup) {
        throw new InvalidRouteJson('InvalidMinGroupForDefaultGroup');
    }

    const sql_response = await projectactivities.event_update.min_group(value.id, minGroup.minGroup, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.MinGroup', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "MinGroup changed",
        mingroup: value.minGroup
    });
});

router.post('/:id/visibility', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const visibility = await ValidateEventVisibility.validateAsync(await req.json());
    if (!visibility) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.visibility(value.id, visibility.visibility, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Visibility', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "Visibility changed",
        visibility: value.visibility
    });
});

router.post('/:id/dateapply', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateApply = await ValidateEventDateApply.validateAsync(await req.json());
    if (!dateApply) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_apply(value.id, dateApply.dateApply, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateApply', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is before the start date');
    
    res.status(200);
    res.json({
        message: "DateApply changed",
        dateapply: value.dateApply
    });
});

router.post('/:id/datestart', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateStart = await ValidateEventDateStart.validateAsync(await req.json());
    if (!dateStart) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_start(value.id, dateStart.dateStart, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateStart', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is after end date');
    
    res.status(200);
    res.json({
        message: "Datestart changed",
        datestart: value.dateStart
    });
});

router.post('/:id/dateend', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateEnd = await ValidateEventDateEnd.validateAsync(await req.json());
    if (!dateEnd) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.date_end(value.id, dateEnd.dateEnd, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.DateEnd', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount).withStatus(400).withInfo('Date is before start date');
    
    res.status(200);
    res.json({
        message: "DateEnd changed",
        dateend: value.dateEnd
    });
});

router.post('/:id/location', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const location = await ValidateEventLocation.validateAsync(await req.json());
    if (!location) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.location_address(value.id, location.location, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Location', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "Location changed",
        location: value.location
    });
});

router.post('/:id/description', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const description = await ValidateEventDescription.validateAsync(await req.json());
    if (!description) throw new InvalidRouteInput('Invalid Route Input');
    const sql_response = await projectactivities.event_update.description(value.id, description.description, req.user.user_id);
    if (sql_response.rowCount !== 1) throw new DBError('Event.Update.Description', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    
    res.status(200);
    res.json({
        message: "Description changed",
        description: value.description
    });
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};