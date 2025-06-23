const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const minify = require('html-minifier').minify;
const { performance } = require('node:perf_hooks');

const { RenderError } = require('@lib/errors');

const auth = require('@config/auth.js');
const { default_group, default_member_group } = require('@config/permissions.js');

const startupUnixTime = Math.floor(Date.now() / 1000); // Keeping global cuz the dynamic pages would trigger a lot of CDN overwrites

class ViewRenderer {
    constructor(app, viewsDir, ttl = Number(process.env.DYNAMICVIEWCACHE_TTL) || 60) {
        if (ViewRenderer.instance) {
            return ViewRenderer.instance;
        }

        ViewRenderer.instance = this;

        this.app = app;
        this.viewsDir = viewsDir;
        this.ttl = ttl;
        this.dynamicCache = {}; // Cache for dynamic pages
        this.static_pages = {}; // Cache for static pages, no TTL

        this.registeredRoutes = new Set();

        this.dashboard_navbar = fs.readFileSync(path.join(viewsDir, 'elements/navbar.ejs'), 'utf8');
        this.footer = fs.readFileSync(path.join(viewsDir, 'elements/footer.ejs'), 'utf8');

        // Render all the html_contents for the templates
        this.html_content = {
            navbar: ejs.render(this.dashboard_navbar, getContextObject()),
            footer: ejs.render(this.footer, getContextObject()),
        };

        this.initiateCacheCleaning();
    }

    /**
     * Get the language data for a specific page
     * @param {String} langCode 
     * @param {String} page 
     * @returns 
     */
    #getLanguageData(langCode, page) {
        const langData = process.availableLanguages[langCode];
        const requiredKeys = process.localsMap[page];

        if (!langData || !requiredKeys) {
            process.log.warn(`Missing language data or mapping for ${langCode}, ${page} (Page exists, but not trnslation config)`);
            return {};
        }

        return requiredKeys.reduce((result, key) => {
            if (langData[key]) {
                result[key] = langData[key];
            } else {
                process.log.error(`Missing language key: ${key} for ${langCode} (A translation from the mapping is missing)`);
            }
            return result;
        }, {});
    }

    /**
     * Render and register all static EJS files in the views directory
     * @param {String} sourceDir 
     * @param {Array} exclude 
     * @param {Object} customRoutes A map of overrides for specific paths. Keys are original paths, values are new paths.
     * @param {String} baseDir 
     */
    registerStaticRoutes(sourceDir, exclude = [], customRoutes = {}, baseDir = sourceDir) {
        const context = getContextObject();

        fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(dirent => {
            if (dirent.name.startsWith('_') || exclude.includes(dirent.name.split(path.sep).join('/'))) {
                return;
            }

            const sourcePath = path.join(sourceDir, dirent.name);
            const relativeSourcePath = path.relative(baseDir, sourcePath).split(path.sep).join('/');
            const extension = path.extname(sourcePath);
            let cacheKey = '/' + relativeSourcePath.replace(extension, '');

            // Check if there is a custom route for this path and adjust the cacheKey accordingly
            if (customRoutes.hasOwnProperty(relativeSourcePath)) {
                cacheKey = customRoutes[relativeSourcePath];
            }

            if (dirent.isDirectory()) {
                // Pass the customRoutes down recursively
                this.registerStaticRoutes(sourcePath, exclude, customRoutes, baseDir);
            } else if (extension === '.ejs') {
                if (this.static_pages[cacheKey]) return;
                // Render the page for each available language
                Object.keys(process.availableLanguages).forEach(language => {
                    const localizedCacheKey = `${cacheKey}_${language}`;
                    const startTime = performance.now();
                    ejs.renderFile(sourcePath, { ...context, html_content: this.html_content, language: this.#getLanguageData(language, cacheKey) }, (err, str) => {
                        if (err) throw new RenderError("Static Rendering Error").setError(err);
                        const endTime = performance.now();
                        if (process.env.MINIFY == "true") {
                            const minifyTime = performance.now();
                            const mstr = minify(str, {
                                collapseWhitespace: true,
                                collapseInlineTagWhitespace: true,
                                conservativeCollapse: true,
                                removeScriptTypeAttributes: true,
                                removeStyleTypeAttributes: true,
                                removeAttributeQuotes: true,
                                removeEmptyAttributes: true,
                                removeOptionalTags: true,
                                removeRedundantAttributes: true,
                                useShortDoctype: true,
                                minifyURLs: true,
                                removeComments: true,
                                minifyCSS: true,
                                minifyJS: true,
                            });
                            const minifyEndTime = performance.now();
                            process.log.debug(`[RENCACHE] Minified (${(str.length / 1024).toFixed(0)}KB -> ${(mstr.length / 1024).toFixed(0)}KB) static page: ${localizedCacheKey} (Render: ${Math.floor((endTime * 1000) - (startTime * 1000))}μs Minify:${Math.floor((minifyEndTime) - (minifyTime))}ms)`);
                            this.static_pages[localizedCacheKey] = mstr;
                        } else {
                            process.log.debug(`[RENCACHE] Static page: ${localizedCacheKey} (${Math.floor((endTime * 1000) - (startTime * 1000))}μs)`);
                            this.static_pages[localizedCacheKey] = str;
                        }
                    });
                });

                if (!this.registeredRoutes.has(cacheKey)) {
                    this.app.get(cacheKey, (req, res) => {
                        let cookie_language = req.cookies.language || process.env.FALLBACKLANG;
                        // Check if cookie language is listed in process.countryConfig { de: 'Deutsch', en: 'English' }
                        if (!process.countryConfig[cookie_language]) {
                            process.log.warn(`[RENCACHE] Cookie language not found: ${cookie_language}`);
                            cookie_language = process.env.FALLBACKLANG;
                        }
                        const localizedCacheKey = `${cacheKey}_${cookie_language}`;

                        if (this.static_pages[localizedCacheKey]) {
                            process.log.debug(`[RENCACHE] Got static page: ${cacheKey} (${cookie_language})`);
                            res.send(this.static_pages[localizedCacheKey]);
                        } else {
                            process.log.error(`Static page not found: ${cacheKey} (${cookie_language})`);
                            res.status(404).send('Page not found');
                        }
                    });

                    process.log.debug(`Registered static page route: ${cacheKey}`);
                    this.registeredRoutes.add(cacheKey);
                }
            }
        });
    }

    /**
     * Register all dynamic EJS files in the views directory
     */
    registerDynamicRoutes() {
        /**
         * Scan a directory for dynamic routes
         * @param {String} dir 
         * @param {String} baseRoute 
         */
        const scanDirectory = (dir, baseRoute = '') => {
            fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
                const relativePath = path.relative(this.viewsDir, path.join(dir, dirent.name));
                const routePath = this.convertFilenameToRoute(relativePath);
                if (dirent.isDirectory()) {
                    scanDirectory(path.join(dir, dirent.name), baseRoute + dirent.name + '/');
                } else if (dirent.name.startsWith('_')) {
                    if (!this.registeredRoutes.has(routePath)) {
                        this.registerRoute(path.join(dir, dirent.name), routePath);
                        this.registeredRoutes.add(routePath);
                    }
                }
            });
        };

        scanDirectory(this.viewsDir);
    }

    /**
     * Register a dynamic route
     * @param {String} filePath 
     * @param {String} routePath 
     */
    registerRoute(filePath, routePath) {
        this.app.get(routePath, (req, res) => {
            for (const [key, value] of Object.entries(req.params)) {
                if (value.length > 64) {
                    throw new RenderError(`Parameter '${key}' exceeds the maximum length of 64 characters.`).withStatus(400).withInfo("InvalidRouteInput");
                }
            }

            let cookie_language = req.cookies.language || process.env.FALLBACKLANG;
            // Check if cookie language is listed in process.countryConfig { de: 'Deutsch', en: 'English' }
            if (!process.countryConfig[cookie_language]) {
                process.log.warn(`[RENCACHE] Cookie language not found: ${cookie_language}`);
                cookie_language = process.env.FALLBACKLANG;
            }

            const cacheKey = `${routePath}_${cookie_language}_${JSON.stringify(req.params)}`;

            const cachedContent = this.dynamicCache[cacheKey];
            // Cache is automaticly cleaned in intervals, so no time check needed here
            if (cachedContent) {
                process.log.debug(`[RENCACHE] Got dynamic template: ${this.#replaceInString(routePath, req.params)}`);
                return res.send(cachedContent.html);
            }

            const startTime = performance.now();
            ejs.renderFile(filePath, { params: req.params, html_content: this.html_content, language: process.availableLanguages[cookie_language], ...getContextObject() }, (err, str) => {
                if (err) throw new RenderError("Rendering Error").setError(err);
                const endTime = performance.now();
                if (process.env.MINIFY == "true") {
                    const minifyTime = performance.now();
                    const mstr = minify(str, {
                        collapseWhitespace: true,
                        collapseInlineTagWhitespace: true,
                        conservativeCollapse: true,
                        removeScriptTypeAttributes: true,
                        removeStyleTypeAttributes: true,
                        removeAttributeQuotes: true,
                        removeEmptyAttributes: true,
                        removeOptionalTags: true,
                        removeRedundantAttributes: true,
                        useShortDoctype: true,
                        minifyURLs: true,
                        removeComments: true,
                        minifyCSS: true,
                        minifyJS: true,
                    });
                    const minifyEndTime = performance.now();
                    process.log.debug(`[RENCACHE] Dynamic minified template (${(str.length / 1024).toFixed(0)}KB -> ${(mstr.length / 1024).toFixed(0)}KB): ${cacheKey} (Render: ${Math.floor((endTime * 1000) - (startTime * 1000))}μs Minify:${Math.floor((minifyEndTime) - (minifyTime))}ms)`);
                    this.dynamicCache[cacheKey] = { html: mstr, timestamp: Date.now() };
                    res.send(mstr);
                } else {
                    process.log.debug(`[RENCACHE] Dynamic template: ${cacheKey} (${Math.floor((endTime * 1000) - (startTime * 1000))}μs)`);
                    this.dynamicCache[cacheKey] = { html: str, timestamp: Date.now() };
                    res.send(str);
                }
            });
        });
    }

    /**
     * Convert a file path to a route path, remove index from names and parse parameters
     * @param {String} filePath 
     * @returns 
     */
    convertFilenameToRoute(filePath) {
        let normalizedPath = filePath.replace(/\\/g, '/').replace('.ejs', '');

        let segments = normalizedPath.split('/').map(segment => {
            if (segment.startsWith('_')) {
                let [dynamicPart, suffix] = segment.substring(1).split('_', 2);
                if (suffix && suffix !== 'index') {
                    return ':' + dynamicPart + '/' + suffix;
                } else {
                    return ':' + dynamicPart;
                }
            }
            return segment;
        });

        let route = segments.join('/');
        if (!route.startsWith('/')) {
            route = '/' + route;
        }

        if (route.endsWith('/index')) {
            route = route.substring(0, route.length - '/index'.length);
        }

        return route;
    }

    /**
     * Replace placeholders in a string with data
     * @param {String} template 
     * @param {Object} data 
     * @returns 
     */
    #replaceInString(template, data) {
        return template.replace(/:([a-zA-Z]+)/g, (match, key) => {
            if (data.hasOwnProperty(key)) {
                return data[key];
            }
            return match;
        });
    }

    /**
     * Initiate the cache cleaning interval
     */
    initiateCacheCleaning() {
        const cleaningInterval = 1000; // In milliseconds

        setInterval(() => {
            const now = Date.now();
            Object.keys(this.dynamicCache).forEach((key) => {
                const cachedItem = this.dynamicCache[key];
                if (now - cachedItem.timestamp > this.ttl * 1000) {
                    delete this.dynamicCache[key];
                }
            });
        }, cleaningInterval);
    }
}

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
        curentUnixTime: startupUnixTime,
        default_group: default_group,
        default_member_group: default_member_group,
        countryConfig: process.countryConfig,
        linkableapps: process.linkableapps,
        permissions_groups: Object.keys(process.permissions_config.groups),
        domain: process.env.DOMAIN,
        app_name: process.env.APPLICATION,
    };

    return context;
};

module.exports = {
    ViewRenderer,
    getContextObject,
};