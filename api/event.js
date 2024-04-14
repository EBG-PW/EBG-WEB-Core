const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { projectactivities } = require('@lib/postgres');
const HyperExpress = require('hyper-express');
const { InvalidRouteJson, DBError } = require('@lib/errors');
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
    minGroup: Joi.string().valid(...['reg', 'member']).required(),
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
    minGroup: Joi.string().valid(...['reg', 'member']).required()
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

router.get('/', verifyRequest('web.event.get.events.read'), limiter(), async (req, res) => {
    const value = await pageCheck.validateAsync(req.query);
    const events = await projectactivities.GetByPage(Number(value.page) - 1, value.size, req.user.user_id, `%${value.search}%`);
    res.status(200);
    res.json(events);
});

router.get('/:id', verifyRequest('web.event.get.event.read'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const event_data = await projectactivities.GetByUUID(value.id);
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

    const event_response = await projectactivities.create(eventName, description, '', color, location, dateStart, dateEnd, dateApply, minGroup, visibility, 0, req.user.user_id);

    res.status(200);
    res.json({
        puuid: event_response,
    });
});

router.get('/count', verifyRequest('web.event.get.count.read'), limiter(), async (req, res) => {
    const value = await pageCountCheck.validateAsync(req.query);
    const amount = await projectactivities.GetCount(`%${value.search}%`);
    res.status(200);
    res.json(amount);
});

router.post('/:id/name', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const name = await ValidateEventName.validateAsync(await req.json());
    if (!name) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateName(value.id, name.name);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/color', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const color = await ValidateEventColor.validateAsync(await req.json());
    if (!color) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateColor(value.id, color.color);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/mingroup', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const minGroup = await ValidateEventMinGroup.validateAsync(await req.json());
    if (!minGroup) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateMinGroup(value.id, minGroup.minGroup);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/visibility', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const visibility = await ValidateEventVisibility.validateAsync(await req.json());
    if (!visibility) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateVisibility(value.id, visibility.visibility);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/dateapply', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateApply = await ValidateEventDateApply.validateAsync(await req.json());
    if (!dateApply) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateDateApply(value.id, dateApply.dateApply);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/datestart', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateStart = await ValidateEventDateStart.validateAsync(await req.json());
    if (!dateStart) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateDateStart(value.id, dateStart.dateStart);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/dateend', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const dateEnd = await ValidateEventDateEnd.validateAsync(await req.json());
    if (!dateEnd) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateDateEnd(value.id, dateEnd.dateEnd);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/location', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const location = await ValidateEventLocation.validateAsync(await req.json());
    if (!location) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateLocation(value.id, location.location);
    res.status(200);
    res.json(event_data);
});

router.post('/:id/description', verifyRequest('web.event.update.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const description = await ValidateEventDescription.validateAsync(await req.json());
    if (!description) throw new InvalidRouteInput('Invalid Route Input');
    const event_data = await projectactivities.UpdateDescription(value.id, description.description);
    res.status(200);
    res.json(event_data);
});

router.delete('/:id', verifyRequest('web.event.delete.event.write'), limiter(), async (req, res) => {
    const value = await ValidateUUID.validateAsync(req.params);
    const event_data = await projectactivities.Delete(value.id);
    res.status(200);
    res.json(event_data);
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};