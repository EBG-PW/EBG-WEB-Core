const fs = require('fs');
const path = require('path');

const baseFolder = path.join('config', 'locales');
const defaultLang = 'de'; // Default language folder

// Get all keys from a JSON file
const getJsonKeys = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
        const jsonData = JSON.parse(content);
        return Object.keys(jsonData);
    } catch (error) {
        console.error(`Error parsing JSON in file: ${filePath}`, error);
        return [];
    }
};

// Main function to compare keys
const findMissingKeys = () => {
    const folders = fs.readdirSync(baseFolder).filter(folder => 
        fs.statSync(path.join(baseFolder, folder)).isDirectory()
    );

    if (!folders.includes(defaultLang)) {
        console.error(`Default language folder "${defaultLang}" not found!`);
        return;
    }

    const defaultFolderPath = path.join(baseFolder, defaultLang);
    const defaultFiles = fs.readdirSync(defaultFolderPath);

    folders.forEach(folder => {
        if (folder === defaultLang) return;

        console.log(`\nComparing "${folder}" with "${defaultLang}"...`);
        const folderPath = path.join(baseFolder, folder);

        defaultFiles.forEach(file => {
            const defaultFilePath = path.join(defaultFolderPath, file);
            const targetFilePath = path.join(folderPath, file);

            if (!fs.existsSync(targetFilePath)) {
                console.warn(`Missing file: ${file} in "${folder}"`);
                return;
            }

            const defaultKeys = getJsonKeys(defaultFilePath);
            const targetKeys = getJsonKeys(targetFilePath);

            const missingKeys = defaultKeys.filter(key => !targetKeys.includes(key));
            const extraKeys = targetKeys.filter(key => !defaultKeys.includes(key));

            if (missingKeys.length > 0) {
                console.warn(`Missing keys in "${folder}/${file}":`, missingKeys);
            }

            if (extraKeys.length > 0) {
                console.log(`Extra keys in "${folder}/${file}":`, extraKeys);
            }
        });
    });
};

findMissingKeys();
