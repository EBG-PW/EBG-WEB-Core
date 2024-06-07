const updateElementText = (element, newText) => {
    if (element.hasChildNodes()) {
        let hasOnlyTextNodes = Array.from(element.childNodes).every(node => node.nodeType === Node.TEXT_NODE);

        if (hasOnlyTextNodes) {
            // If all child nodes are text, replace the whole text content
            element.textContent = newText;
        } else {
            // If there are mixed nodes, replace only the direct text node
            let textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.nodeValue = newText;
        }
    } else {
        // If no child nodes, just update the text content
        element.textContent = newText;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
        console.log("Translate starting DOM translation...");
        /* Translate all elements marked with spesific html tags */
        document.querySelectorAll("[data-translate]").forEach((element) => {
            const key = element.getAttribute("data-translate");
            if (key) {
                updateElementText(element, i18next.t(key));
            }
        });
    
        // Translate placeholders
        document.querySelectorAll("[data-translate-placeholder]").forEach((element) => {
            const key = element.getAttribute("data-translate-placeholder");
            if (key) {
                element.setAttribute('placeholder', i18next.t(key));
            }
        });
    
        // Translate title
        document.querySelectorAll("[data-translate-title]").forEach((element) => {
            const key = element.getAttribute("data-translate-title");
            if (key) {
                element.setAttribute('title', i18next.t(key));
            }
        });
    
        /* Generate a translated layout */
        if (localStorage.getItem('user_group') != undefined) {
            if (document.getElementById('Dashboard.Profile.User_Group') != undefined) {
                document.getElementById('Dashboard.Profile.User_Group').innerHTML = i18next.t(`User_Groups.${localStorage.getItem('user_group')}`);
            }
        }
    
        // Generate the Profile dropdown
        if(document.getElementById('Dashboard.ProfileDropdown') != undefined) {
            const dropdown = document.getElementById('Dashboard.ProfileDropdown');
    
            if(checkPermission('app.user.profile.*').result) {
                dropdown.innerHTML += `<a href="/profile" class="dropdown-item">${i18next.t('Dashboard.Header.Profile.Profile')}</a>`;
            }
            if(checkPermission('app.user.settings.*').result) {
                dropdown.innerHTML += `<a href="/settings-account" class="dropdown-item">${i18next.t('Dashboard.Header.Profile.Settings')}</a>`;
            }
            if(checkPermission('app.user.apps.*').result) {
                dropdown.innerHTML += `<div class="dropdown-divider"></div>`;
                dropdown.innerHTML += `<a href="/apps" class="dropdown-item">${i18next.t('Dashboard.Header.Profile.Apps')}</a>`;
            }
            dropdown.innerHTML += `<div class="dropdown-divider"></div>`;
            if(checkPermission('app.web.logout').result) {
                dropdown.innerHTML += `<a onClick="logout()" class="dropdown-item">${i18next.t('Dashboard.Header.Profile.Logout')}</a>`;
            }
        }
    
        // Generate Navbar
        if(document.getElementById('Dashboard.Navbar.Elements') != undefined) {
            const navbar = document.getElementById('Dashboard.Navbar.Elements');
    
            // Add Home
            navbar.innerHTML += `
            <li class="nav-item">
                <a class="nav-link" href="/dashboard" >
                    <span class="nav-link-icon d-md-none d-lg-inline-block"><!-- Download SVG icon from http://tabler-icons.io/i/home -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg></span>
                    <span class="nav-link-title">${i18next.t('Dashboard.Header.Navbar.Home')}</span>
                </a>
            </li>`
    
            // Add Projects
            if(checkPermission('app.project.user.*').result) {
                navbar.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="/projects" >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"><!-- Download SVG icon from http://tabler-icons.io/i/home -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-briefcase-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9z" /><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" /></svg></span>
                        <span class="nav-link-title">${i18next.t('Dashboard.Header.Navbar.Projects')}</span>
                    </a>
                </li>`
            }
    
            // Add Events
            if(checkPermission('app.event.user.*').result) {
                navbar.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="/events" >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"><!-- Download SVG icon from http://tabler-icons.io/i/home -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-ticket" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 5l0 2" /><path d="M15 11l0 2" /><path d="M15 17l0 2" /><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2" /></svg></span>
                        <span class="nav-link-title">${i18next.t('Dashboard.Header.Navbar.Events')}</span>
                    </a>
                </li>`
            }
    
            // Add Service(s) the user has access to
            let services_string = "";
    
            if(checkPermission('service.game.user.*').result) {
                services_string += `<a class="dropdown-item" href="/services/game">${i18next.t('Dashboard.Header.Navbar.Services.Game')}</a>`
            }
    
            if(checkPermission('service.vm.user.*').result) {
                services_string += `<a class="dropdown-item" href="/services/vm">${i18next.t('Dashboard.Header.Navbar.Services.Vm')}</a>`
            }
    
            if(services_string.length > 0) {
                navbar.innerHTML += `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle" href="#navbar-service" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false" >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"><!-- Download SVG icon from http://tabler-icons.io/i/lifebuoy -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-device-desktop" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10z" /><path d="M7 20h10" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>
                        </span>
                        <span class="nav-link-title">${i18next.t('Dashboard.Header.Navbar.Services.Name')}</span>
                      </a>
                      <div class="dropdown-menu">
                        ${services_string}
                      </div>
                    </li>`
            }
    
            // Admin und Vereins Management
            // User Management
            if(checkPermission('app.admin.usermgm.*').result) {
                navbar.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="/admin" >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"><!-- Download SVG icon from http://tabler-icons.io/i/home -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-users" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg></span>
                        <span class="nav-link-title">${i18next.t('Dashboard.Header.Navbar.UserManagment')}</span>
                    </a>
                </li>`
            }
        }
});