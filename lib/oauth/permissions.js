class oAuthPermissions {
    constructor() {
        if (oAuthPermissions.instance) {
            return oAuthPermissions.instance;
        }

        oAuthPermissions.instance = this;

        this.permissions = {
            "USER:ID:READ": 1 << 1,
            "USER:ID:WRITE": 1 << 2,
            "USER:USERNAME:READ": 1 << 3,
            "USER:USERNAME:WRITE": 1 << 4,
            "USER:EMAIL:READ": 1 << 5,
            "USER:EMAIL:WRITE": 1 << 6,
            "USER:REALNAME:READ": 1 << 7,
            "USER:REALNAME:WRITE": 1 << 8,
            "USER:BIO:READ": 1 << 9,
            "USER:BIO:WRITE": 1 << 10,
            "USER:AVATAR:READ": 1 << 11,
            "USER:AVATAR:WRITE": 1 << 12,
            "USER:GROUP:READ": 1 << 13,
            "USER:GROUP:WRITE": 1 << 14,
            "USER:ADDRESS:READ": 1 << 15,
            "USER:ADDRESS:WRITE": 1 << 16,
            "SETTINGS:DESIGN:READ": 1 << 17,
            "SETTINGS:DESIGN:WRITE": 1 << 18,
            "SETTINGS:LANG:READ": 1 << 19,
            "SETTINGS:LANG:WRITE": 1 << 20,
            "EVENTS:LIST:READ": 1 << 21,
            "PROJECTS:LIST:READ": 1 << 22,
            "INTEGRATION:TELEGRAM:READ": 1 << 23,
            "INTEGRATION:DISCORD:READ": 1 << 24,
            "NOTIFICATIONS:READ": 1 << 25,
            "NOTIFICATIONS:WRITE": 1 << 26,
        }

        this.permissionsTranslationKey = {
            "USER:ID:READ": "UserIdRead",
            "USER:ID:WRITE": "UserIdWrite",
            "USER:USERNAME:READ": "UserUsernameRead",
            "USER:USERNAME:WRITE": "UserUsernameWrite",
            "USER:EMAIL:READ": "UserEmailRead",
            "USER:EMAIL:WRITE": "UserEmailWrite",
            "USER:REALNAME:READ": "UserRealnameRead",
            "USER:REALNAME:WRITE": "UserRealnameWrite",
            "USER:BIO:READ": "UserBioRead",
            "USER:BIO:WRITE": "UserBioWrite",
            "USER:AVATAR:READ": "UserAvatarRead",
            "USER:AVATAR:WRITE": "UserAvatarWrite",
            "USER:GROUP:READ": "UserGroupRead",
            "USER:GROUP:WRITE": "UserGroupWrite",
            "USER:ADDRESS:READ": "UserAddressRead",
            "USER:ADDRESS:WRITE": "UserAddressWrite",
            "SETTINGS:DESIGN:READ": "SettingsDesignRead",
            "SETTINGS:DESIGN:WRITE": "SettingsDesignWrite",
            "SETTINGS:LANG:READ": "SettingsLanguageRead",
            "SETTINGS:LANG:WRITE": "SettingsLanguageWrite",
            "EVENTS:LIST:READ": "EventsListRead",
            "PROJECTS:LIST:READ": "ProjectsListRead",
            "INTEGRATION:TELEGRAM:READ": "IntegrationTelegramRead",
            "INTEGRATION:DISCORD:READ": "IntegrationDiscordRead",
            "NOTIFICATIONS:READ": "NotificationsRead",
            "NOTIFICATIONS:WRITE": "NotificationsWrite",
        }

        this.permissionsSQLFields = {
            "USER:ID:READ": ["users.id"],
            "USER:USERNAME:READ": ["users.username"],
            "USER:EMAIL:READ": ["users.email"],
            "USER:REALNAME:READ": ["users.first_name", "users.last_name"],
            "USER:BIO:READ": ["users.bio"],
            "USER:AVATAR:READ": ["users.avatar_url"],
            "USER:GROUP:READ": ["users.user_group"],
            "USER:ADDRESS:READ": ["users_addresses.country", "users_addresses.state", "users_addresses.city", "users_addresses.zip", "users_addresses.address"],
            "SETTINGS:DESIGN:READ": ["users_settings.design"],
            "SETTINGS:LANG:READ": ["users_settings.language"],
        };
    }

    /**
     * Calculate the permission int
     * @param {string<array>} permissions 
     * @returns {number}
     */
    genPermission = (permissions) => {
        let combInt = 0;
        for (const perm in permissions) {
            combInt |= this.permissions[permissions[perm]]
        }
        return combInt;
    }

    /**
     * Check if the permission is given
     * @param {number} combInt 
     * @param {string} permission 
     * @returns {boolean}
     */
    hasPermission = (combInt, permission) => {
        return (combInt & this.permissions[permission]) === this.permissions[permission]
    }

    /**
     * Check there are any integrations, return the required integration name or if not return false
     * @param {Number} combInt 
     * @returns 
     */
    hasIntegrations = (combInt) => {
        let result = [];
        if ((combInt & this.permissions["INTEGRATION:TELEGRAM:READ"]) === this.permissions["INTEGRATION:TELEGRAM:READ"]) {
            result.push("TELEGRAM");
        }
        if ((combInt & this.permissions["INTEGRATION:DISCORD:READ"]) === this.permissions["INTEGRATION:DISCORD:READ"]) {
            result.push("DISCORD");
        }
        
        return result.length > 0 ? result : false;
    }

    hasActivities = (combInt) => {
        let result = [];
        if ((combInt & this.permissions["EVENTS:LIST:READ"]) === this.permissions["EVENTS:LIST:READ"]) {
            result.push(1);
        }
        if ((combInt & this.permissions["PROJECTS:LIST:READ"]) === this.permissions["PROJECTS:LIST:READ"]) {
            result.push(2);
        }
        
        return result.length > 0 ? result : false;
    }

    /**
     * Get all SQL fields within the combined int
     * @param {Number} combInt 
     * @returns 
     */
    getSQLFields = (combInt) => {
        const result = [];
        // If exists in permissionsSQLFields
        for (const [key, value] of Object.entries(this.permissionsSQLFields)) {
            if ((combInt & this.permissions[key]) === this.permissions[key]) {
                result.push(...value);
            }
        }
        return result;
    }

    /**
     * Get all permissions within the combined int
     * @param {number} combInt 
     * @returns {array}
     */
    listPermissions = (combInt) => {
        const result = [];
        for (const [key, value] of Object.entries(this.permissions)) {
            if ((combInt & value) === value) {
                result.push(key);
            }
        }
        return result;
    }

    /**
     * Get all permissions translation keys
     * @param {number} combInt
     * @returns {array}
     */
    listPermissionsTranslation = (combInt) => {
        const result = [];
        for (const [key, value] of Object.entries(this.permissions)) {
            if ((combInt & value) === value) {
                result.push(this.permissionsTranslationKey[key]);
            }
        }
        return result;
    }
}

module.exports = new oAuthPermissions()