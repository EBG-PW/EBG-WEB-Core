// Generate and load all layout related stuff

// Set Dashboard AvatarIcon <span class="avatar avatar-sm" id="Dashboard.AvatarIcon" style="background-image: url()"></span>
if (localStorage.getItem('avatar_url') !== null) {
    if(document.getElementById('Dashboard.Profile.AvatarIcon') !== null) document.getElementById('Dashboard.Profile.AvatarIcon').style.backgroundImage = `url(${localStorage.getItem('avatar_url')})`;
}

if (localStorage.getItem('avatar_url') !== null) {
    if(document.getElementById('Settings.Profile.AvatarIcon') !== null) document.getElementById('Settings.Profile.AvatarIcon').style.backgroundImage = `url(${localStorage.getItem('avatar_url')})`;
}

// Set Dashboard Username <span id="Dashboard.Profile.Username"></span>
if (localStorage.getItem('username') !== null) {
    if(document.getElementById('Dashboard.Profile.Username') !== null) document.getElementById('Dashboard.Profile.Username').innerHTML = localStorage.getItem('username');
}

// Function
const toggleColor = (style) => {
    // Store the chance in the database (POST /api/v1/user/layout)
    fetch('/api/v1/user/layout', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",

            "Authorization": "Bearer " + localStorage.getItem('token')
        },
        body: JSON.stringify({
            design: style,
        }),
    }).then(async (response) => {
        if (response.status === 200) {
            const data = await response.json();
            console.log(data);
            localStorage.setItem('tablerTheme', style);
            window.location.reload();
        } else {
            throw new Error(response.statusText);
        }
    }).catch(err => console.log(err));
}