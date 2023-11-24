const Joi = require('joi');
const { user } = require('@lib/postgres');
const { verifyRequest } = require('@middleware/verifyRequest');
const { delWebtoken } = require('@lib/cache');
const HyperExpress = require('hyper-express');
const { InvalidRouteInput, DBError } = require('@lib/errors');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'User'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const LayoutCheck = Joi.object({
    design: Joi.string().valid('light', 'dark').required(),
});

router.post('/layout', verifyRequest('web.user.layout.write'), async (req, res) => {
    const value = await LayoutCheck.validateAsync(await req.json());
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    const sql_response = await user.settings.updateDesign(req.user.user_id, value.design);
    if(sql_response.rowCount !== 1) throw new DBError('User.Settings.UpdateDesign', 1, typeof 1, sql_response.rowCount, typeof sql_response.rowCount);
    // Flush the cache
    await delWebtoken(req.authorization);

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