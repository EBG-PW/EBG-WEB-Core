/*
    app_permissions: List all permissions that are native to the application itself.
    All those permissions do not have a read or write part.
    However all those permissions need read & write to be true in order for a user to get them granted!
*/

module.exports = {
    "app_permissions": [
        "app.web.login",
        "app.web.logout"
    ],
    "default_group": "user",
    "groups": {
        "app": {
            "permissions": [
                "app.web.login",
                "app.web.logout"
            ]
        },
        "user": {
            "permissions": [
                "app.test.write",
                "app.test.read",
                
                "app.drogen.write",
                "app.legal.*",
            ],
            "inherit": [
                "app"
            ]
        },
        "admin": {
            "permissions": [
                "*"
            ]
        }
    }
}