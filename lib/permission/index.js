const { app_permissions, groups } = require("@config/permissions.js");

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
 * Merges SQL and group permissions, respecting SQL overrides and removing duplicates.
 * @param {Array} sqlPermissions - Permissions from SQL.
 * @param {string} groupName - The group name to which the user belongs.
 * @returns {Array} - Array of final permissions.
 */
const mergePermissions = (sqlPermissions, groupName) => {
  let finalPermissions = formatSQLPermissions(sqlPermissions);
  let groupPermissions = collectGroupPermissions(groupName);

  groupPermissions.forEach(perm => {
    if (!isPermissionIncluded(perm, finalPermissions)) {
      finalPermissions.push(perm);
    }
  });

  return [...new Set(finalPermissions)]; // Remove duplicates
};

const formatSQLPermissions = (permissions) => {
  let formatted = [];
  let permissionMap = new Map();

  for (let i = 0; i < permissions.length; i++) {
    const { permission, read, write } = permissions[i];
    if (permission === "*") { return ["*"]; }

    if (!permissionMap.has(permission)) {
      permissionMap.set(permission, { read: false, write: false });
    }

    let perm = permissionMap.get(permission);
    perm.read = perm.read || read;
    perm.write = perm.write || write;
  }

  for (let [permission, { read, write }] of permissionMap.entries()) {
    if (read && write) {
      formatted.push(`${permission}.*`);
    } else {
      if (write) formatted.push(`${permission}.write`);
      if (read) formatted.push(`${permission}.read`);
    }
  }

  return formatted;
}

/**
 * Collects all permissions of a group and its inherited groups.
 * @param {string} groupName - The group name.
 * @returns {Array} - Array of permissions for the group.
 */
const collectGroupPermissions = (groupName) => {
  let permissions = [];
  if (groups[groupName]) {
    permissions = [...groups[groupName].permissions];

    // Add inherited permissions
    if (groups[groupName].inherit) {
      groups[groupName].inherit.forEach(inheritedGroupName => {
        permissions = [...permissions, ...collectGroupPermissions(inheritedGroupName)];
      });
    }
  }
  return permissions;
};

const isPermissionIncluded = (permission, existingPermissions) => {
  if (existingPermissions.includes('*')) {
    return true;
  }

  let parts = permission.split('.');
  while (parts.length > 0) {
    let check = parts.join('.') + '.*';
    if (existingPermissions.includes(check)) {
      return true;
    }
    parts.pop();
  }

  if (existingPermissions.includes(permission)) {
    return true;
  }

  // Check for read/write specific permissions
  let basePerm = permission.split('.').slice(0, -1).join('.');
  if (existingPermissions.includes(`${basePerm}.read`) || existingPermissions.includes(`${basePerm}.write`)) {
    return true;
  }

  return false;
};

module.exports = {
  checkPermission: checkPermission,
  mergePermissions: mergePermissions
}