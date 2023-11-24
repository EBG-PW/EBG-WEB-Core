// Generate and load all layout related stuff
if(localStorage.getItem('tablerTheme') != null) {

    const themeSetting = localStorage.getItem('tablerTheme');
    // Split the theme setting into its components
    const settings = themeSetting.split('.');

    const color = settings[0]; // 'Dark' or 'Light'
    const layout = settings[1]; // 'centered' or 'fluid'


    if(color == 'dark') {
        document.body.setAttribute('data-bs-theme', 'dark');
    } else {
        document.body.removeAttribute('data-bs-theme');
    }

    // Apply layout type
    if (layout === 'fluid') {
        document.body.classList.add('layout-fluid');
    } else {
        document.body.classList.remove('layout-fluid');
    }
}