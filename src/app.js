const HyperExpress = require('hyper-express');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const app = new HyperExpress.Server({
    fast_buffers: process.env.HE_FAST_BUFFERS == 'false' ? false : true || false,
});

const { log_errors } = require('@config/errors')

app.use(expressCspHeader({
    directives: {
        'default-src': [SELF],
        'script-src': [SELF, INLINE],
        'style-src': [SELF, INLINE, "https://rsms.me/inter/inter.css"], // Allow CSS from the specific URL
        'font-src': [SELF, "https://rsms.me/inter/font-files/"], // Allow fonts from the specific URL
        'img-src': [SELF, INLINE],
        'worker-src': [NONE],
        'connect-src': [SELF, `ws://${process.env.WebSocketURL}`, `wss://${process.env.WebSocketURL}`],
        'block-all-mixed-content': true
    }
}));

/* Server Static Files */

app.get('/', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.send(fs.readFileSync(path.join(__dirname, '..', 'public', 'landingpage.html')));
})

app.get('/dashboard', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'public', 'auth', 'sign-in.html'));
});

const apiv1 = require('@api');
const auth_handler = require('@static_api/auth');

app.get('/*', (req, res) => {
    // Split the URL to separate the path and query string
    const filePath = req.url.split('?')[0];

    // Determine the content type based on the file extension
    switch (filePath.split('.').pop()) {
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

    try {
        // Read the file from the filesystem without the query string
        res.send(fs.readFileSync(path.join(__dirname, '..', 'public', filePath)));
    } catch (error) {
        process.log.error(error)
        res.status(404);
        res.send("404 - Not Found");
    };
});

app.use('/api/v1', apiv1);
app.use('/auth', auth_handler);

/* Handlers */
app.set_error_handler((req, res, error) => {
    process.log.debug(error);
    const outError = {
        message: error.message || "",
        info: error.info || "",
        reason: error.reason || "",
        headers: error.headers || false,
        statusCode: error.status || 500, // Default to error 500
        back_url: error.back_url || false,
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

    if (outError.back_url) {
        ejs.renderFile(path.join(__dirname, '..', 'views', 'error', 'error-xxx.ejs'), outError, (err, str) => {
            if (err) {
                res.json({
                    message: outError.message,
                    info: outError.info,
                    reason: outError.reason,
                });

                throw err;
            } else {
                res.header('Content-Type', 'text/html');
                res.send(str);
            }
        });
    } else {
        res.json({
            message: outError.message,
            info: outError.info,
            reason: outError.reason,
        });
    }
});

module.exports = app;