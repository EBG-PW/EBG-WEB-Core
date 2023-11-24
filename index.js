require('dotenv').config();
require('module-alias/register')

const port = process.env.PORT || 80;
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

const { log } = require('@lib/logger');

process.log = {};
process.log = log;

setTimeout(() => {
    const app = require('@src/app');

    setTimeout(() => {
        if (process.env.ExtraErrorWebDelay > 0) {
            process.log.system(`Webserver was delayed by ${process.env.ExtraErrorWebDelay || 500}ms beause of a error.`);
        }
        app.listen(port)
            .then((socket) => process.log.system(`Listening on port: ${port}`))
            .catch((error) => process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`));
    }, process.env.ExtraErrorWebDelay || 500);
}, process.env.GlobalWaitTime || 100);