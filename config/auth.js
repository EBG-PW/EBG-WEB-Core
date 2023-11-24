module.exports = {
    "Github": {
        "url": "https://github.com/login/oauth/authorize",
        "url_auth": "https://github.com/login/oauth/access_token",
        "url_scope": ["user:read", "user:email"],
        "clientID": "",
        "clientSecret": "",
    },
    "Google": {
        "url": "https://accounts.google.com/o/oauth2/v2/auth",
        "url_auth": "https://oauth2.googleapis.com/token",
        "url_redirect": "http://localhost/auth/google/callback",
        "url_scope": ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        "clientID": "",
        "clientSecret": "",
    }
}
