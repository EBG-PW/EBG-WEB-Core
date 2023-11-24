const HyperExpress = require('hyper-express');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const fs = require('fs');
const path = require('path');
const app = new HyperExpress.Server({
    fast_buffers: process.env.HE_FAST_BUFFERS == 'false' ? false : true || false,
});

const { log_errors } = require('@config/errors')

app.use(expressCspHeader({
    directives: {
        'default-src': [SELF],
        'script-src': [SELF, INLINE],
        'style-src': [SELF, INLINE],
        'img-src': [SELF, INLINE],
        'worker-src': [NONE],
        'connect-src': [[SELF], `ws://${process.env.WebSocketURL}`, `wss://${process.env.WebSocketURL}`],
        'block-all-mixed-content': true
    }
}));

/* Server Static Files */

app.get('/', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', 'index.html')));
})

app.get('/login', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'www-public', 'login', 'index.html'));
});

const apiv1 = require('@api');

app.get('/dist/*', (req, res) => {
    switch (req.url.split('.').pop()) {
        case 'js':
            res.header('Content-Type', 'text/javascript');
            break;
        case 'css':
            res.header('Content-Type', 'text/css');
            break;
        case 'png':
            res.header('Content-Type', 'image/png');
            break;
        case 'jpg':
            res.header('Content-Type', 'image/jpg');
            break;
        case 'svg':
            res.header('Content-Type', 'image/svg+xml');
            break;
        case 'ico':
            res.header('Content-Type', 'image/x-icon');
            break;
        default:
            res.header('Content-Type', 'text/plain');
            break;
    }
    res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', req.url)));
})

app.use('/api/v1', apiv1);

/* Handlers */
app.set_error_handler((req, res, error) => {
    console.log(error)
    process.log.debug(error);
    const outError = {
        message: error.message || "",
        info: error.info || "",
        reason: error.reason || "",
        headers: error.headers || false,
        statusCode: error.status || 500, // Default to error 500
    }

    /* Returns 400 if the client didn´t provide all data/wrong data type*/
    if (error.name === "ValidationError" || error.name === "InvalidOption") {
        outError.message = error.name
        outError.info = error.message
        outError.reason = error.details
        outError.statusCode = 400;
    }

    /* Returns 401 if the client is not authorized*/
    if (error.message === "Token not provided" || error.message === "Token Invalid") {
        statusCode = 401;
    }

    /* Returns 403 if the client is not allowed to do something*/
    if (error.message === "NoPermissions" || error.message === "Permission Denied") {
        statusCode = 403;
    }

    /* Returns 429 if the client is ratelimited*/
    if (error.message === "Too Many Requests" || error.message === "Too Many Requests - IP Blocked") {
        statusCode = 429;
    }

    if (log_errors[error.name]) process.log.error(`[${outError.statusCode}] ${req.method} "${req.url}" >> ${outError.message} in "${error.path}:${error.fileline}"`);
    res.status(outError.statusCode);
    if (outError.headers) { res.header(outError.headers.name, outError.headers.value); }
    res.json({
        message: outError.message,
        info: outError.info,
        reason: outError.reason,
    });
});

module.exports = app;