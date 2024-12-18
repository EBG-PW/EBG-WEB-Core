const sharp = require('sharp');
const ip3country = require("ip3country");
ip3country.init();

/**
 * Generate a unique url path for one time tokens
 * @param {Number} length 
 */
const generateUrlPath = (length = 128) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Get the true IP of the request
 * @param {Object} req 
 * @returns 
 */
const getIpOfRequest = (req) => {
    let IP;
    if (process.env.CLOUDFLARE_PROXY === 'true' || process.env.CLOUDFLARE_PROXY == true) {
        if(req.headers['x-forwarded-for']) process.log.warn('Requests are comming from a normal proxy but cloudflare proxy is set in the env file')
        if(!req.headers['cf-connecting-ip']) process.log.warn('Cloudflare proxy is set in the env file but requests are not comming from a cloudflare proxy')
        IP = req.headers['cf-connecting-ip'] || req.ip //This only works with cloudflare proxy
    } else if (process.env.ANY_PROXY === 'true' || process.env.ANY_PROXY == true) {
        if(req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a cloudflare but normal proxy is set in the env file')
        if(!req.headers['x-forwarded-for']) process.log.warn('Normal proxy is set in the env file but requests are not comming from a normal proxy')
        IP = req.headers['x-forwarded-for'] || req.ip //This only works without cloudflare
    } else {
        if(req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip']) process.log.warn('Requests are comming from a proxy but no proxy is set in the env file')
        IP = req.ip //This only works without any proxy
    }
    return IP;
}

/**
 * Get the country of an IP
 * @param {String} IP 
 * @returns 
 */
const getCountryOfIP = (IP) => {
    return ip3country.lookupStr(IP);
}

/**
 * Replacer function for JSON.stringify to convert BigInts to strings
 * @param {String} key 
 * @param {Any} value 
 * @returns 
 */
const bigIntReplacer = (key, value) => {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Pass this function a stream and it will return a buffer once the stream has endet
 * @param {Stream} stream 
 * @returns {Promise<Buffer>}
 */
const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        stream.on('error', err => {
            reject(err);
        });
    });
}

/**
 * Check if a buffer is a valid JPEG image and not too large (ENV: MAX_AVATAR_SIZE)
 * @param {Buffer} buffer
 * @param {Number} xPx | Maximum width of the image
 * @param {Number} yPx | Maximum height of the image
 * @returns {Promise<Boolean>}
 */
const verifyBufferIsJPG = async (buffer, xPx, yPx) => {
    const MAX_SIZE = (parseInt(process.env.MAX_AVATAR_SIZE_KB, 10) || 150) * 1024;
    const JPEG_SIGNATURES = [
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE8])
    ];

    // Check if the buffer is too large
    if (buffer.length > MAX_SIZE) {
        return false;
    }

    // Check if the buffer starts with a valid JPEG signature
    const isJPEG = JPEG_SIGNATURES.some(signature => {
        return buffer.subarray(0, 4).equals(signature);
    });

    if (!isJPEG) {
        return false;
    }

    try {
        const metadata = await sharp(buffer).metadata();

        // Check if the image is approximately square and within size limits
        const isSquare = Math.abs(metadata.width - metadata.height) / Math.max(metadata.width, metadata.height) <= 0.05;
        // Check if the image is within the size limits
        const isWithinSizeLimit = metadata.width <= xPx && metadata.height <= yPx;

        return isSquare && isWithinSizeLimit;
    } catch (err) {
        console.error("Error processing image with sharp:", err);
        return false;
    }
}

module.exports = {
    generateUrlPath: generateUrlPath,
    getIpOfRequest: getIpOfRequest,
    getCountryOfIP: getCountryOfIP,
    bigIntReplacer: bigIntReplacer,
    streamToBuffer: streamToBuffer,
    verifyBufferIsJPG: verifyBufferIsJPG
}