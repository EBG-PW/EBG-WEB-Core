const Joi = require('joi');
const { integration } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { limiter } = require('@middleware/limiter');
const HyperExpress = require('hyper-express');
const bcrypt = require('bcrypt');
const { InvalidRouteInput, DBError, InvalidLogin } = require('@lib/errors');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'Integration'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version


// Validate likable accounts, so it needs to accept profile links, usernames and user ids
const LinkCheck = Joi.object({
    id: Joi.string().valid("SettingsIntegrationTelegram").required(),
    value: Joi.string().min(1).pattern(/^[a-zA-Z0-9_]*$/).required(),
});

router.get('/', verifyRequest('web.user.integration.read'), limiter(1), async (req, res) => {
    const integrations = await integration.get(req.user.user_id);

    for (let i = 0; i < integrations.length; i++) {
        if(integrations[i].platform === 'TELEGRAM') {
            integrations[i].id = 'SettingsIntegrationTelegram';
        }
    }

    res.status(200);
    res.json(integrations);
});

router.post('/', verifyRequest('web.user.integration.write'), limiter(1), async (req, res) => {
    const value = await LinkCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    let platform = ""

    if(value.id === 'SettingsIntegrationTelegram') {
        platform = "TELEGRAM"

        // Check if the value is a valid telegram id (Integer)
        if(isNaN(value.value)) {
            throw new InvalidRouteInput('Telegram ID MUST be a number');
        }
    }

    await integration.add(req.user.user_id, platform, value.value)

    res.status(200);
    res.json({
        message: 'Layout changed',
        design: value.design,
    });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};