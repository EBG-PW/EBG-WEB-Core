const { app_permissions } = require("@config/permissions.js");

/**
 * @typedef {Object} PermissionResponse
 * @property {Boolean} result - True if the user has the permission
 * @property {String} reason - The reason for the result
 */

/**
 * [Route].[Endpoint].[Exact(Optional)]
 * It can use * to terminate early AND make all permissions below it true.
 * @param {String} user_permissions 
 * @param {String} required_permission 
 * @returns {PermissionResponse}
 */
const checkPermission = (user_permissions, required_permission) => {
  if (!user_permissions) {
    return { result: false, reason: "Permission not found." };
  }

  for (let i = 0; i < user_permissions.length; i++) {
    let perm = user_permissions[i];
    if (perm === required_permission || perm === "*" || (perm.endsWith(".*") && required_permission.startsWith(perm.slice(0, -2)))) {
      return { result: true, reason: perm };
    }
  }

  return { result: false, reason: "Not permitted." };
}

/**
 * Converts the permissions array from the SQL DB to a array for the application
 * @param {Array} permissions 
 * @returns 
 */
const formatSQLPermissions = (permissions) => {
  let formatted = [];
  for (let i = 0; i < permissions.length; i++) {
    const { permission, read, write } = permissions[i];
    if (permission === "*") { return ["*"]; }
    if (app_permissions.includes(permission) && read === true && write === true) {
      formatted.push(permission);
    } else {
      if(permission.endsWith(".*")){
        formatted.push(permission);
        continue;
      }
      if(write && read) {
        formatted.push(`${permission}.*`);
        continue;
      }
      if(write) formatted.push(`${permission}.write`);
      if(read) formatted.push(`${permission}.read`);
    }
  }
  return formatted;
}

module.exports = {
  checkPermission: checkPermission,
  formatSQLPermissions: formatSQLPermissions
}