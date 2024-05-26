/**
 * @typedef {Object} PermissionResponse
 * @property {Boolean} result - True if the user has the permission
 * @property {String} reason - The reason for the result
 */

/**
 * [Route].[Endpoint].[Exact(Optional)]
 * It can use * to terminate early AND make all permissions below it true.
 * @param {String} required_permission 
 * @returns {PermissionResponse}
 */
const checkPermission = (required_permission) => {
  const user_permissions = JSON.parse(localStorage.getItem("permissions")) || [];

  let hasGeneralPermission = false;
  let specificDenySet = new Set();

  for (let perm of user_permissions) {
    // Check if the permission is explicitly set
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

const checkSession = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    if(!window.location.href.includes("login") &&
      !window.location.href.includes("register") &&
      !window.location.href.includes("requestresetpassword") && 
      !window.location.href.includes("resetpassword")) window.location.href = "/login";
    return { result: false, reason: "No token found." };
  }

  const response = await fetch("/api/v1/login/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      "Authorization": "Bearer " + localStorage.getItem('token')
    },
  });
  if (response.status === 200) {
    const data = await response.json();

    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", data.username);
    localStorage.setItem("puuid", data.puuid);
    localStorage.setItem("avatar_url", data.avatar_url);
    localStorage.setItem("language", data.language);
    localStorage.setItem("tablerTheme", data.design);
    localStorage.setItem("user_group", data.user_group);
    localStorage.setItem("token", data.token);
    localStorage.setItem("permissions", JSON.stringify(data.permissions));

    if(window.location.href.includes("login")) window.location.href = "/dashboard";
  } else {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("puuid");
    localStorage.removeItem("avatar_url");
    localStorage.removeItem("language");
    localStorage.removeItem("user_group");
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    if(!window.location.href.includes("login") && !window.location.href.includes("register") && !window.location.href.includes("passwordreset")) window.location.href = "/login";
    throw new Error(response.statusText);
  }
}

checkSession();