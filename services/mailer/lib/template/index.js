const fs = require('fs');
const path = require('path');

/**
 * Reads all .png files from a given directory, converts them to base64,
 * and returns an object with the base64 strings, keyed by the file names.
 * 
 * @param {string} dirPath - The path to the directory containing .png files.
 * @return {Promise<Object>} - A promise that resolves to an object mapping file names to base64 strings.
 */
async function convertPngFilesToBase64(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      const base64Images = {};
      files.forEach(file => {
        if (path.extname(file).toLowerCase() === '.png') {
          const filePath = path.join(dirPath, file);
          const fileData = fs.readFileSync(filePath);
          const base64String = `data:image/png;base64,${fileData.toString('base64')}`;
          // Use the file name without extension as key
          const key = path.basename(file.replaceAll("-","_"), '.png');
          base64Images[key] = base64String;
        }
      });

      resolve(base64Images);
    });
  });
}

module.exports = {
    convertPngFilesToBase64
};