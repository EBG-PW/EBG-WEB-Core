const localLang = localStorage.getItem('language') ?? navigator.language.split('-')[0];

const switchLang = (lang) => {

};

function updateElementText(element, newText) {
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

const getLang = async () => {
    const response = await fetch(`/dist/locales/${localLang}.json`);
    const data = await response.json();
    return data;
}

document.addEventListener("DOMContentLoaded", async () => {
    const langFile = await getLang();
    i18next.init({
        lng: localLang,
        debug: true,
        resources: {
            [localLang]: {
                translation: langFile
            }
        }
    });

    if (localStorage.getItem('user_group') !== null) {
        if (document.getElementById('Dashboard.Profile.User_Group') !== null) {
            document.getElementById('Dashboard.Profile.User_Group').innerHTML = i18next.t(`User_Groups.${localStorage.getItem('user_group')}`);
        }
    }

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
});