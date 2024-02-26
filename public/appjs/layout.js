// Set Dashboard AvatarIcon <span class="avatar avatar-sm" id="Dashboard.AvatarIcon" style="background-image: url()"></span>
if (localStorage.getItem('avatar_url') != null) {
    if (document.getElementById('Dashboard.Profile.AvatarIcon') != null) document.getElementById('Dashboard.Profile.AvatarIcon').style.backgroundImage = `url(${localStorage.getItem('avatar_url')})`;
}

if (localStorage.getItem('avatar_url') != null) {
    if (document.getElementById('Settings.Profile.AvatarIcon') != null) document.getElementById('Settings.Profile.AvatarIcon').style.backgroundImage = `url(${localStorage.getItem('avatar_url')})`;
}

// Set Dashboard Username <span id="Dashboard.Profile.Username"></span>
if (localStorage.getItem('username') != null) {
    if (document.getElementById('Dashboard.Profile.Username') != null) document.getElementById('Dashboard.Profile.Username').innerHTML = localStorage.getItem('username');
}

const logout = async () => {
    try {
        const response = await fetch('/api/v1/login/logout', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
        });

        if (response.status === 200) {
            localStorage.removeItem('user_id');
            localStorage.removeItem('puuid');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar_url');
            localStorage.removeItem('language');
            localStorage.removeItem('token');
            localStorage.removeItem('user_group');
            localStorage.removeItem('permissions');
            window.location.href = "/login";
        } else {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log(err);
    }
}


const toggleColor = async (color) => {
    let design = localStorage.getItem('tablerTheme');
    let parts = design ? design.split('.') : ['light', 'centered']; // default values
    parts[0] = color; // Update the color part
    let newDesign = parts.join('.');

    try {
        const response = await fetch('/api/v1/user/layout', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
            body: JSON.stringify({ design: newDesign }),
        });

        if (response.status === 200) {
            localStorage.setItem('tablerTheme', newDesign);
            window.location.reload();
        } else {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log(err);
    }
};

const toggleFullscreen = async (layout) => {
    let design = localStorage.getItem('tablerTheme');
    let parts = design ? design.split('.') : ['light', 'centered']; // default values
    parts[1] = layout;
    let newDesign = parts.join('.');

    try {
        const response = await fetch('/api/v1/user/layout', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
            body: JSON.stringify({ design: newDesign }),
        });

        if (response.status === 200) {
            localStorage.setItem('tablerTheme', newDesign);
            window.location.reload();
        } else {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log(err);
    }
};

const changeLanguage = async (language) => {
    try {
        const response = await fetch('/api/v1/user/language', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
            body: JSON.stringify({ language: language }),
        });

        if (response.status === 200) {
            localStorage.setItem('language', language);
            window.location.reload();
        } else {
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log(err);
    }
}

const closeModal = (modal_id) => {
    const modalElement = document.getElementById(modal_id);
    modalElement.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.querySelector('.modal-backdrop').remove();
}

const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
}