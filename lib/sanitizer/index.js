const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

/**
 * Remove all html tags from a string
 * @param {string} string
 */
const fullysanitizedString = Joi.extend((joi) => ({
    type: 'sanitizedString',
    base: joi.string(),
    coerce(value, helpers) {
        if (value) {
            return { value: sanitizeHtml(value) };
        }
        return value;
    }
}));

/**
 * Remove all html tags exept for <b>, <i>, <u>, <strong>, <em>, <h1>, <h2>, <h3>, <code>
 * @param {string} string
 */
const sanitizedString = Joi.extend((joi) => ({
    type: 'sanitizedString',
    base: joi.string(),
    coerce(value, helpers) {
        if (value) {
            return { value: sanitizeHtml(value, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'code' ])
            }) };
        }
        return value;
    }
}));

module.exports = {
    fullysanitizedString,
    sanitizedString
}