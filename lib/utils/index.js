const sharp = require('sharp');

/**
 * Generate a unique url path for one time tokens
 * @param {Number} length 
 */
const generateUrlPath = (length = 256) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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
 * @returns {Boolean}
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
    streamToBuffer: streamToBuffer,
    verifyBufferIsJPG: verifyBufferIsJPG
}