const Joi = require('joi');
const { admin, webtoken } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const { delWebtoken } = require('@lib/cache');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const HyperExpress = require('hyper-express');
const { default_member_group } = require("@config/permissions.js");
const { InvalidRouteInput, DBError } = require('@lib/errors');
const router = new HyperExpress.Router();


/* Plugin info*/
const PluginName = 'External_Skript'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const accessKeyCheck = Joi.object({
    search: Joi.string().min(128).max(128).pattern(/^[a-zA-Z0-9!]*$/).required(),
});



module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};

