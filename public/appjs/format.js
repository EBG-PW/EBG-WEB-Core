const blocklist = {
    "fluid": [
        "login"
    ]
}

// Generate and load all layout related stuff
if (localStorage.getItem('tablerTheme') != null) {

    const themeSetting = localStorage.getItem('tablerTheme');
    // Split the theme setting into its components
    const settings = themeSetting.split('.');

    const color = settings[0]; // 'Dark' or 'Light'
    const layout = settings[1]; // 'centered' or 'fluid'


    if (color == 'dark') {
        document.body.setAttribute('data-bs-theme', 'dark');
    } else {
        document.body.removeAttribute('data-bs-theme');
    }

    // Check if url is in blocklist
    if (blocklist[layout].includes(window.location.pathname.split('/')[1])) {
        // If it is, redirect to the other layout
        if (layout == 'fluid') {
            document.body.classList.remove('layout-fluid');
        } else {
            document.body.classList.add('layout-fluid');
        }
    } else {
        // Apply layout type
        if (layout === 'fluid') {
            document.body.classList.add('layout-fluid');
        } else {
            document.body.classList.remove('layout-fluid');
        }
    }
}