const Joi = require('joi');
const { fullysanitizedString, sanitizedString } = require('@lib/sanitizer');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const HyperExpress = require('hyper-express');
const { InvalidRouteInput, DBError } = require('@lib/errors');
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
    name: Joi.fullysanitizedString().min(3).max(128).required(),
    color: Joi.string().valid(...avaiableColors).required(),
    visibility: Joi.number().min(0).max(1).required(),
    dateApply: Joi.date().required(),
    dateStart: Joi.date().required(),
    dateEnd: Joi.date().required(),
    location: Joi.fullysanitizedString().min(3).max(256).required(),
    description: Joi.sanitizedString().min(3).max(2048).required()
});

