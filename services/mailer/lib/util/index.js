/**
 * Generate a one time numeric code
 * @param {Number} length 
 */
const generateOneTimePassword = (length = 6) => {
    return Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) + Math.pow(10, length - 1);
}

module.exports = {
    generateOneTimePassword: generateOneTimePassword
}
