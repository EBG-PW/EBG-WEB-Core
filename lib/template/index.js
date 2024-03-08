const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const auth = require('@config/auth.js');

/**
 * Render all EJS files in a directory to HTML files in another directory
 * @param {String} sourceDir 
 * @param {String} destDir 
 * @param {Object} exclude 
 */
const renderEJSToPublic = (sourceDir, destDir, exclude = []) => {
    // Normalize paths in the exclude list
    const context = getContextObject();
    const excludePaths = exclude.map(exPath => path.normalize(exPath));
    fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(dirent => {
        const sourcePath = path.join(sourceDir, dirent.name);
        const relativeSourcePath = path.relative(sourceDir, sourcePath);
        const destPath = path.join(destDir, dirent.name).replace('.ejs', '.html');

        if (excludePaths.includes(relativeSourcePath)) return;

        if (dirent.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            renderEJSToPublic(sourcePath, destPath, exclude);
        } else if (path.extname(sourcePath) === '.ejs') {
            ejs.renderFile(sourcePath, context, (err, str) => {
                if (err) throw err;
                fs.writeFileSync(destPath, str);
            });
        }
    });
};

/**
 * Generate the context object to pass to EJS templates
 * @returns {Object} - The context object to pass to EJS templates
 */
const getContextObject = () => {
    const context = {
        Github: {
            OAuthUrl: `${auth.Github.url}?client_id=${auth.Github.clientID}&scope=${auth.Github.url_scope.join(',')}`,
        },
        Google: {
            OAuthUrl: `${auth.Google.url}?client_id=${auth.Google.clientID}&redirect_uri=${auth.Google.url_redirect}&response_type=code&scope=${auth.Google.url_scope.join(' ')}`,
        },
        countryConfig: process.countryConfig,
        linkableapps: process.linkableapps,
        domain: process.env.DOMAIN,
    };

    return context;
};

module.exports = {
    renderEJSToPublic,
    getContextObject,
};