require('dotenv').config();
require('module-alias/register')

const port = process.env.PORT || 80;
const bindip = process.env.BINDIP || 'localhost';
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

const { log } = require('@lib/logger');

const fs = require('fs');

process.log = {};
process.log = log;

// Render Templates
const path = require('path');
/* Load some config data, thats needed to render the HTML pages on startup */
// Get all translation files from \public\dist\locales and generate a context object ({ [language]: [file key.language] })
const localesDir = path.join(__dirname, 'config', 'locales');

let availableLanguages = {};
let countryConfig = {};

// Recursive loader for language components
const loadLanguageComponents = (langDir) => {
    const components = {};
    const files = fs.readdirSync(langDir);

    files.forEach(file => {
        const filePath = path.join(langDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            components[file] = loadLanguageComponents(filePath); // Recurse into subdirectories
        } else if (file.endsWith('.json')) {
            const componentName = path.basename(file, '.json');
            const fileContents = fs.readFileSync(filePath, 'utf8');
            components[componentName] = JSON.parse(fileContents);
        }
    });

    return components;
}

// Preload language files
const languages = fs.readdirSync(localesDir);
languages.forEach(langCode => {
    const langDir = path.join(localesDir, langCode);
    if (fs.lstatSync(langDir).isDirectory()) {
        availableLanguages[langCode] = loadLanguageComponents(langDir);
        countryConfig[langCode] = availableLanguages[langCode].LocalLanguages.local;
    }
});

// Expose globals
process.availableLanguages = availableLanguages; // Used for template rendering for different languages
process.countryConfig = countryConfig; // Used for language dropdowns
process.localsMap = require('@config/locals_map.js'); // Used for template rendering for different languages

const linkableapps = require('@config/linkable_apps.js');
process.linkableapps = Object.keys(linkableapps)
    .sort()
    .reduce((acc, key) => {
        acc[key] = linkableapps[key];
        return acc;
    }, {});
process.permissions_config = require('@config/permissions.js');

(async () => {
    try {
        setTimeout(() => {
            const app = require('@src/app');

            setTimeout(() => {
                if (process.env.ExtraErrorWebDelay > 0) {
                    process.log.system(`Webserver was delayed by ${process.env.ExtraErrorWebDelay || 500}ms beause of a error.`);
                }
                app.listen(port, bindip)
                    .then((socket) => process.log.system(`Listening on port: ${port}`))
                    .catch((error) => process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`));
            }, 1500);
        }, process.env.GlobalWaitTime || 100);
    } catch (error) {
        process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`);
    }
})();