const HyperExpress = require('hyper-express');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { ViewRenderer } = require('@lib/template');
const app = new HyperExpress.Server({
    fast_buffers: process.env.HE_FAST_BUFFERS == 'false' ? false : true || false,
});

const { log_errors } = require('@config/errors')

app.use(expressCspHeader({
    directives: {
        'default-src': [SELF],
        'script-src': [SELF, INLINE],
        'style-src': [SELF, INLINE, "https://rsms.me/inter/inter.css"],
        'font-src': [SELF, "https://rsms.me/inter/font-files/"],
        'img-src': [
            SELF,
            INLINE,
            "data:",
            "blob:",
            "https://avatars.githubusercontent.com/u/", // GitHub avatars
            "https://lh3.googleusercontent.com/", // Google profile images
            "https://cupcake.yearin.lol/cupcake/assets/", // Cupcake images (Temporarily)
        ],
        'worker-src': [NONE],
        'connect-src': [
            SELF,
            `ws://${process.env.WebSocketURL}`,
            `wss://${process.env.WebSocketURL}`
        ],
        'block-all-mixed-content': true
    }
}));

const renderer = new ViewRenderer(app, path.join(__dirname, '..', 'views'));

// Register the static routes and overwrite some filename paths internaly
renderer.registerStaticRoutes(path.join(__dirname, '..', 'views'),
    ["error-xxx.ejs", "sign-up-verify.ejs", "reset-password.ejs", "navbar.ejs", "footer.ejs", "navbar_template.ejs", "legal.ejs"],
    {
        "auth/sign-in.ejs": "/login",
        "auth/sign-up.ejs": "/register",
        "auth/reset-password-request.ejs": "/requestresetpassword",
    });

// Register the dynamic routes
renderer.registerDynamicRoutes();

const apiv1 = require('@api');
const images_handler = require('@static_api/images');
const auth_handler = require('@static_api/auth');
const oauth_handler = require('@static_api/oauth');

app.get('/', (req, res) => {
    res.header('Cache-Control', 'public, max-age=172800');
    res.header('Content-Type', 'text/html');
    res.send(fs.readFileSync(path.join(__dirname, '..', 'landingpage', 'dist', 'index.html')));
});

app.get('/en', (req, res) => {
    res.header('Cache-Control', 'public, max-age=172800');
    res.header('Content-Type', 'text/html');
    res.send(fs.readFileSync(path.join(__dirname, '..', 'landingpage', 'dist', 'en', 'index.html')));
});

app.use('/api/v1', apiv1);
app.use('/i', images_handler);
app.use('/auth', auth_handler);
app.use('/oauth', oauth_handler);

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
        // Add cache poloicy to cache 48h
        res.header('Cache-Control', 'public, max-age=172800');

        let file_to_send = null;
        if (fs.existsSync(path.join(__dirname, '..', 'public', filePath))) {
            file_to_send = path.join(__dirname, '..', 'public', filePath);
        } else if (fs.existsSync(path.join(__dirname, '..', 'landingpage', 'dist', filePath))) {
            file_to_send = path.join(__dirname, '..', 'landingpage', 'dist', filePath);
        } else {
            throw new Error(`File not found - ${filePath}`);
        }
        res.send(fs.readFileSync(file_to_send));
    } catch (error) {
        process.log.error(error)
        res.status(404);
        if (req.accepts('html')) {
            ejs.renderFile(path.join(__dirname, '..', 'views', 'error', 'error-xxx.ejs'), { statusCode: 404, message: "Page not found", info: "Request can not be served", reason: "The requested page was not found", domain: process.env.DOMAIN, back_url: process.env.DOMAIN }, (err, str) => {
                if (err) throw err;
                res.header('Content-Type', 'text/html');
                res.send(str);
            });
        } else {
            res.header('Content-Type', 'application/json');
            res.json({ message: "Page not found", info: "Request can not be served", reason: "The requested page was not found" });

        }
    };
});

// Catch all POST requests (404)
app.post('/*', (req, res) => {
    res.status(404);
    res.header('Content-Type', 'application/json');
    res.json({ message: "Route not Found", info: "Request can not be served", reason: "The requested route was not found" });
});

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

    if (log_errors[error.name] && !error.secret_reason) process.log.error(`[${outError.statusCode}] ${req.method} "${req.url}" >> ${outError.message} in "${error.path}:${error.fileline}"`);
    if (log_errors[error.name] && error.secret_reason) process.log.error(`[${outError.statusCode}] ${req.method} "${req.url}" >> ${outError.message} in "${error.path}:${error.fileline}" >> ${error.secret_reason}`);
    if (error.error) console.log(error.error)
    res.status(outError.statusCode);
    if (outError.headers) { res.header(outError.headers.name, outError.headers.value); }
    if (outError.back_url && req.accepts('html')) {
        outError.domain = process.env.DOMAIN; // Apend the domain to the error
        ejs.renderFile(path.join(__dirname, '..', 'views', 'error', 'error-xxx.ejs'), outError, (err, str) => {
            if (err) {
                res.header('Content-Type', 'application/json');
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
        res.header('Content-Type', 'application/json');
        res.json({
            message: outError.message,
            info: outError.info,
            reason: outError.reason,
        });
    }
});

module.exports = app;