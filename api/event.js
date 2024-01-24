const Joi = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { event } = require('@lib/postgres');
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

router.post('/', verifyRequest('web.event.create.event'), limiter(), async (req, res) => {
    const value = await NewEventCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');
    const { eventName, color, minGroup, visibility, dateApply, dateStart, dateEnd, location, description } = value;

    // Check if the apply date is before the start date, and the start date is before the end date
    if (dateApply > dateStart) throw new InvalidRouteJson('NewEventApplyBeforeStart');
    if (dateStart > dateEnd) throw new InvalidRouteJson('NewEventEndBeforeStart');

    const event_response = await event.create(eventName, description, '', color, location, dateStart, dateEnd, dateApply, minGroup, visibility, 0, req.user.user_id);

    console.log(event_response);

    res.status(200);
    res.json({
        puuid: event_response,
    });
});

module.exports = {
    router,
    PluginName,
    PluginRequirements,
    PluginVersion
};