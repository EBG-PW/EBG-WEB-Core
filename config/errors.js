/*
    Define which errors should be logged to the console.
    Note, all errors will always be returned to the client.
*/
module.exports = {
    "log_errors": {
        "CustomError": true,
        "RenderError": true,
        "TooManyRequests": true,
        "InvalidToken": true,
        "Invalid2FA": false,
        "InvalidLogin": true,
        "InvalidRouteInput": true,
        "PermissionsError": true,
        "OAuthError": true,
        "SQLError": true,
        "DBError": true,
        "TypeError": true,
    }
}