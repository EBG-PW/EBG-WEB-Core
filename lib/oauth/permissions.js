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
            "USER:ADRESS:READ": 1 << 15,
            "USER:ADRESS:WRITE": 1 << 16,
            "SETTINGS:DESIGN:READ": 1 << 17,
            "SETTINGS:DESIGN:WRITE": 1 << 18,
            "SETTINGS:LANG:READ": 1 << 19,
            "SETTINGS:LANG:WRITE": 1 << 20,
            "EVENTS:LIST:READ": 1 << 21,
            "PROJECTS:LIST:READ": 1 << 22
        }

        this.permissionsFields = {
            "USER:ID:READ": ["field.user.id"],
            "USER:ID:WRITE": ["field.user.id"],
            "USER:USERNAME:READ": ["field.user.username"],
            "USER:USERNAME:WRITE": ["field.user.username"],
            "USER:EMAIL:READ": ["fields.user.email"],
            "USER:EMAIL:WRITE": ["fields.user.email"],
            "USER:REALNAME:READ": ["fields.user.firstname", "fields.user.lastname"],
            "USER:REALNAME:WRITE": ["fields.user.firstname", "fields.user.lastname"],
            "USER:BIO:READ": ["fields.user.bio"],
            "USER:BIO:WRITE": ["fields.user.bio"],
            "USER:AVATAR:READ": ["fields.user.avatar"],
            "USER:AVATAR:WRITE": ["fields.user.avatar"],
            "USER:GROUP:READ": ["fields.user.group"],
            "USER:GROUP:WRITE": ["fields.user.group"],
            "USER:ADRESS:READ": ["fields.user.country", "fields.user.state", "fields.user.city", "fields.user.zip", "fields.user.adress"],
            "USER:ADRESS:WRITE": ["fields.user.country", "fields.user.state", "fields.user.city", "fields.user.zip", "fields.user.adress"],
            "SETTINGS:DESIGN:READ": ["fields.settings.desing"],
            "SETTINGS:DESIGN:WRITE": ["fields.settings.desing"],
            "SETTINGS:LANG:READ": ["fields.settings.language"],
            "SETTINGS:LANG:WRITE": ["fields.settings.language"],
            "EVENTS:LIST:READ": ["fields.events.events"],
            "PROJECTS:LIST:READ": ["fields.events.projects"]
        }
    }

    /**
     * Calculate the permission int
     * @param {string<array>} permissions 
     * @returns {number}
     */
    genPermission = (permissions) => {
        let combInt = 0;
        for(const perm in permissions) {
            combInt |= this.permissions[permissions[perm]]
        }
        return combInt;
    }

    /**
     * Check if the permission i given
     * @param {number} combInt 
     * @param {string} permission 
     * @returns {boolean}
     */
    hasPermission = (combInt, permission) => {
        return (combInt & this.permissions[permission]) === this.permissions[permission]
    }

    /**
     * Check if user has all permissions
     * @param {number} combInt
     * @param {array} permissions
     * @returns {boolean}
     */
    checkPermissions = 

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
}

module.exports = new oAuthPermissions()