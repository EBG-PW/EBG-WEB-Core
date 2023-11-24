const { app_permissions, groups } = require("@config/permissions.js");

/*
  This is a extensive and versatile permission system.
  A user can have groups, witch can inherit from other groups.
  Be aware that inharitance is recursive, so a group can inherit from a group that inherits from a group.
  A user can have special permissions in SQL, those SQL permissions can override the group permissions.
  A SQL Permission can also deny a permission granted by a group.
  All permissions get compressed and deduplicated to the shortest possible form while keeping the same meaning.
  There is no limit in the length of a permission, you can do like app.web.user.performace.login or whatever and it works.
  For frontend, if a user got a * permission, it also applys to the non start permission: Example
  app.web.* will also apply to app.web
  While app.web.login wont grant app.web permissions, so your frontend can simply check app.web to decide if the user can access the web interface.
  For a finetuned permission system, you can set your routes to explisit permissions like app.web.login, that either is true with app.* or app.web.login.
  The validator function always provides a reason why a permission is granted or denied.
  Specifically restricted means, that a SQL permission denied a permission granted by a group.
*/

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

  let hasGeneralPermission = false;
  let specificDenySet = new Set();

  for (let perm of user_permissions) {
    // CHeck if the permission is explicitly set
    if (perm === required_permission) {
      return { result: true, reason: perm };
    }
    // Check if a global permission is present
    if (perm === "*") {
      hasGeneralPermission = true;
      continue;
    }
    // Check if the permission is a global permission
    if (perm.endsWith(".*")) {
      let basePerm = perm.slice(0, -2);
      if (required_permission.startsWith(basePerm)) {
        hasGeneralPermission = true;
      }
    }
    // If a .read denial is present, the .write denial is also added
    if (perm.endsWith(".read")) {
      specificDenySet.add(perm.replace(".read", ".write"));
    }
    // If a .write denial is present, the .read denial is also added
    if (perm.endsWith(".write")) {
      specificDenySet.add(perm.replace(".write", ".read"));
    }
  }

  if (specificDenySet.has(required_permission)) {
    return { result: false, reason: "Specifically restricted." };
  }

  if (hasGeneralPermission) {
    return { result: true, reason: "General permission granted." };
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

  // Add group permissions if they're not already included
  groupPermissions.forEach(perm => {
    if (!isPermissionIncluded(perm, finalPermissions)) {
      finalPermissions.push(perm);
    }
  });

  // Resolve conflicts: If SQL permissions explicitly define read or write, remove the opposite from finalPermissions
  sqlPermissions.forEach(sqlPermObj => {
    if (sqlPermObj.permission) {
      let basePerm = sqlPermObj.permission;
      if (sqlPermObj.read !== sqlPermObj.write) { // Checks if there's a conflict between read and write
        let oppositeType = sqlPermObj.read ? 'write' : 'read';
        let index = finalPermissions.findIndex(perm => perm === `${basePerm}.${oppositeType}`);
        if (index !== -1) {
          finalPermissions.splice(index, 1); // Remove the opposite permission
        }
      }
    }
  });

  // Remove duplicates
  finalPermissions = [...new Set(finalPermissions)];

  // Object to track the read/write status and positions of permissions
  let permissionTracker = {};

  // First pass: Track read/write permissions and their positions
  finalPermissions.forEach((perm, index) => {
    let parts = perm.split('.');
    let basePerm = parts.slice(0, -1).join('.');
    let type = parts[parts.length - 1];

    if (type === 'read' || type === 'write') {
      if (!permissionTracker[basePerm]) {
        permissionTracker[basePerm] = { read: false, write: false, positions: [] };
      }
      permissionTracker[basePerm][type] = true;
      permissionTracker[basePerm].positions.push(index);
    }
  });

  // Second pass: Remove permissions that have both read and write, and replace with '*'
  Object.keys(permissionTracker).forEach(basePerm => {
    let tracker = permissionTracker[basePerm];
    if (tracker.read && tracker.write) {
      // Remove the original read and write permissions
      tracker.positions.forEach(position => {
        delete finalPermissions[position];
      });
      // Add the consolidated permission with '*'
      finalPermissions.push(`${basePerm}.*`);
    }
  });

  // Filter out undefined elements and remove duplicates
  return [...new Set(finalPermissions.filter(perm => perm !== undefined))];
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

  // Splitting the permission to check the base and the type (read/write)
  let [basePerm, type] = permission.split('.');

  // Checking if the exact permission or the base permission with any type exists
  if (existingPermissions.includes(permission) || existingPermissions.includes(`${basePerm}.*`)) {
    return true;
  }

  // If the type is not specified in the permission being checked,
  // ensure that neither read nor write is already included.
  if (!type) {
    return existingPermissions.includes(`${basePerm}.read`) || existingPermissions.includes(`${basePerm}.write`);
  }

  return false;
};

module.exports = {
  checkPermission: checkPermission,
  mergePermissions: mergePermissions
}