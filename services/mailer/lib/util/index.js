/**
 * Generate a one time numeric code
 * @param {Number} length 
 */
const generateOneTimePassword = (length = 6) => {
    return Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) + Math.pow(10, length - 1);
}

/**
 * 
 */
const replacePlaceholders = (template, t) => {
    const regex = /{{(.*?)}}/g;
    let match;
  
    while ((match = regex.exec(template)) !== null) {
      const key = match[1].trim();
      const value = t(key);
  
      if (typeof value === 'string') {
        template = template.replace(match[0], value);
        template = replacePlaceholders(template, t); 
      }
    }
  
    return template;
  }

module.exports = {
    generateOneTimePassword: generateOneTimePassword,
    replacePlaceholders: replacePlaceholders
}
