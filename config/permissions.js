/*
    app_permissions: List all permissions that are native to the application itself.
    All those permissions do not have a read or write part.
    However all those permissions need read & write to be true in order for a user to get them granted!

    There are 2 groups in the panel, reg and member. For example for the events and activities.
    This needs to be represented by a group.member permission. This will grand the member check for the group.
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
                "app.web.logout",
            ],
            "inherit": ["admin"]
        },
        "reg": {
            "permissions": [
            ],
            "inherit": [
                "app"
            ]
        },
        "member": {
            "permissions": [
                "group.membership"
            ],
            "inherit": [
                "user"
            ]
        },
        "admin": {
            "permissions": [
                "*"
            ],
            "inherit": [
            ]
        }
    }
}