const fs = require('node:fs');
const path = require('node:path');
const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { generateUrlPath } = require('@lib/utils');
const { sendMail } = require('@lib/queues');
const { CTR } = require('@lib/redis');
const HyperExpress = require('hyper-express');
const { default_group } = require('@config/permissions');
const { InvalidRouteInput, InvalidRegister, DBError } = require('@lib/errors');
const bcrypt = require('bcrypt');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'PasswortReset'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version