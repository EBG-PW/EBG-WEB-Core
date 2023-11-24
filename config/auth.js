module.exports = {
    "Github": {
        "url": "https://github.com/login/oauth/authorize",
        "url_auth": "https://github.com/login/oauth/access_token",
        "url_scope": ["user:read", "user:email"],
        "clientID": process.env.GITHUB_CLIENT_ID,
        "clientSecret": process.env.GITHUB_SECRET
    },
    "Google": {
        "url": "https://accounts.google.com/o/oauth2/v2/auth",
        "url_auth": "https://oauth2.googleapis.com/token",
        "url_redirect": "http://localhost/auth/google/callback",
        "url_scope": ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        "clientID": process.env.GOOGLE_CLIENT_ID,
        "clientSecret": process.env.GOOGLE_SECRET
    }
}