const Joi = require('joi');
const { user, webtoken } = require('@lib/postgres');
const { addWebtoken } = require('@lib/cache');
const { mergePermissions, checkPermission } = require('@lib/permission');
const randomstring = require('randomstring');
const HyperExpress = require('hyper-express');
const { PermissionsError, InvalidRouteInput, OAuthError, DBError, InvalidLogin } = require('@lib/errors');
const useragent = require('express-useragent');
const router = new HyperExpress.Router();
const auth_config = require('@config/auth');

const OAuthCheck = Joi.object({
    code: Joi.string().required(),
});

const OAuthCheckGoogle = Joi.object({
    code: Joi.string().required(),
    scope: Joi.string().required(),
    authuser: Joi.number().required(),
    prompt: Joi.string().required(),
});

const generateReturnHTML = (message, user_id, username, avatar_url, user_group, language, design, token, permissions) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Redirecting...</title>
    </head>
    <body>
        <p>${message}. Redirecting to <a href="/">home page</a>...</p>
    </body>
    <script>
        localStorage.setItem('user_id', '${user_id}');
        localStorage.setItem('username', '${username}');
        localStorage.setItem('avatar_url', '${avatar_url}');
        localStorage.setItem('user_group', '${user_group}');
        localStorage.setItem('language', '${language}');
        localStorage.setItem('tablerTheme', '${design}');
        localStorage.setItem('token', '${token}');
        localStorage.setItem('permissions', ${JSON.stringify(permissions)});
        window.location.href = '/dashboard';
    </script>
    </html>
    `;
}

router.get('/github/callback', async (req, res) => {
    const value = await OAuthCheck.validateAsync(req.query);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Make request to github to get access token
    const response = await fetch(auth_config.Github.url_auth, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'EBG-Manager',
        },
        body: JSON.stringify({
            client_id: auth_config.Github.clientID,
            client_secret: auth_config.Github.clientSecret,
            code: value.code,
        }),
    });

    const { access_token, token_type, scope } = await response.json();

    // Get User Email, username and language
    const userResponse = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'EBG-Manager',

            'Authorization': `${token_type} ${access_token}`,
        },
    });
    //Check statuscode
    if (userResponse.status !== 200) throw new OAuthError('Invalid Auth Code, try again');

    const oauth2Response = await userResponse.json();

    const { login, email, avatar_url, bio, name, url } = oauth2Response
    await user.oauth.git(login, email, avatar_url, bio, name, url);

    const user_responses = await user.getByUseridentifyerWithSettings(email);
    if (!user_responses || user_responses.length === 0) throw new InvalidLogin('Invalid Login');
    const user_response = user_responses[0];

    const PermissionsResponse = await user.permission.get(user_response.user_id)
    const Formated_Permissions = mergePermissions(PermissionsResponse.rows, user_response.user_group); // Format the permissions to a array

    const allowed = checkPermission(Formated_Permissions, 'app.web.login'); // Check if user has permissions to login
    if (!allowed.result) throw new PermissionsError('NoPermissions', 'app.web.login');

    const source = req.headers['user-agent']
    const UserAgent = useragent.parse(source)

    const WebToken = randomstring.generate({
        length: process.env.WEBTOKENLENGTH, //DO NOT CHANCE!!!
        charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
    });

    const WebTokenResponse = await webtoken.create(user_response.user_id, user_response.username, WebToken, UserAgent.browser, user_response.language, user_response.design);
    if (WebTokenResponse.rowCount === 0) throw new DBError('Webtoken.Create', 0, typeof 0, WebTokenResponse.rowCount, typeof WebTokenResponse.rowCount);
    await addWebtoken(WebToken, user_response.user_id, user_response.username, Formated_Permissions, UserAgent.browser, user_response.language, user_response.design, new Date().getTime()); // Add the webtoken to the cache

    res.status(200);
    res.send(generateReturnHTML('Login successful', user_response.user_id, user_response.username, user_response.avatar_url, user_response.user_group, user_response.language, user_response.design || "white", WebToken, Formated_Permissions));
});

router.get('/google/callback', async (req, res) => {
    const value = await OAuthCheckGoogle.validateAsync(req.query);
    if (!value) throw new InvalidRouteInput('Invalid Route Input');

    // Make request to google to get access token
    const response = await fetch(auth_config.Google.url_auth, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'EBG-Manager',
        },
        body: JSON.stringify({
            client_id: auth_config.Google.clientID,
            client_secret: auth_config.Google.clientSecret,
            code: value.code,
            redirect_uri: auth_config.Google.url_redirect,
            grant_type: 'authorization_code',
        }),
    });

    const { access_token, token_type, scope } = await response.json();

    // Get User Email, username and language
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'EBG-Manager',

            'Authorization': `${token_type} ${access_token}`,
        },
    });

    //Check statuscode
    if (userResponse.status !== 200) throw new OAuthError('Invalid Auth Code, try again');

    const oauth2Response = await userResponse.json();
    const { name, email, picture, given_name, family_name, locale } = oauth2Response

    await user.oauth.google(name, email, picture, given_name, family_name, locale);

    const user_responses = await user.getByUseridentifyerWithSettings(email);
    if (!user_responses || user_responses.length === 0) throw new InvalidLogin('Invalid Login');
    const user_response = user_responses[0];

    const PermissionsResponse = await user.permission.get(user_response.user_id)
    const Formated_Permissions = mergePermissions(PermissionsResponse.rows, user_response.user_group); // Format the permissions to a array

    const allowed = checkPermission(Formated_Permissions, 'app.web.login'); // Check if user has permissions to login
    if (!allowed.result) throw new PermissionsError('NoPermissions', 'app.web.login');

    const source = req.headers['user-agent']
    const UserAgent = useragent.parse(source)

    const WebToken = randomstring.generate({
        length: process.env.WEBTOKENLENGTH, //DO NOT CHANCE!!!
        charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
    });

    const WebTokenResponse = await webtoken.create(user_response.user_id, user_response.username, WebToken, UserAgent.browser, user_response.language, user_response.design);
    if (WebTokenResponse.rowCount === 0) throw new DBError('Webtoken.Create', 0, typeof 0, WebTokenResponse.rowCount, typeof WebTokenResponse.rowCount);
    await addWebtoken(WebToken, user_response.id, user_response.username, Formated_Permissions, UserAgent.browser, user_response.language, user_response.design, new Date().getTime()); // Add the webtoken to the cache

    res.status(200);
    res.send(generateReturnHTML('Login successful', user_response.user_id, user_response.username, user_response.avatar_url, user_response.user_group, user_response.language, user_response.design || "white", WebToken, Formated_Permissions));

});

module.exports = router;