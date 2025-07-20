module.exports = {
    "/login": ["Login"],
    "/register": ["Register", "Login"],
    "/dashboard": ["Dashboard", "User_Groups"],
    "/events": ["Dashboard", "User_Groups", "Events", "Page", "Error"],
    "/projects": ["Dashboard", "User_Groups", "Projects", "Page"],
    "/requestresetpassword": ["ResetPassword", "Login"],
    "/auth/oauth": ["OAuth"],
    "/auth/reset-password": ["ResetPassword"],
    "/profile-dropdown/settings-account": ["Dashboard", "User_Groups", "Settings", "Login"],
    "/profile-dropdown/settings-integrations": ["Dashboard", "User_Groups", "Settings"],
    "/profile-dropdown/settings-links": ["Dashboard", "User_Groups", "Settings"],
    "/profile-dropdown/settings-misc": ["Dashboard", "User_Groups", "Settings"],
    "/profile-dropdown/settings-sessions": ["Dashboard", "User_Groups", "Settings"],
    "/profile": [],
    "/admin/user-list": ["Dashboard", "User_Groups", "AUserList", "SQLT", "Page"]
}