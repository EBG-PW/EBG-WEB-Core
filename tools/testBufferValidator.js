const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('module-alias/register')

const fs = require('fs');
const readline = require('readline');

const { verifyBufferIsJPG } = require('@lib/utils');

// Function to ask a question in the terminal
const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

/**
 * 
 * @param {String} directoryPath 
 * @returns {Array<Object>}
 */
const listFilesInDirectory = (directoryPath) => {
    return fs.readdirSync(directoryPath).map(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            path: filePath,
            size: stats.size,
            isDirectory: stats.isDirectory()
        };
    });
}

/**
 * 
 * @param {Object} files 
 * @returns {void}
 */
const formatOutput = (files) => {
    const header = 'Filename                          Size (KB)       Result\n' + 
                   '---------------------------------------------------------------------\n';
    let output = header;

    files.forEach(file => {
        const fileName = file.name.padEnd(32);
        const sizeInKB = (file.size / 1024).toFixed(2).padStart(12);
        const result = file.result.padStart(20);

        output += `${fileName} ${sizeInKB} ${result}\n`;
    });

    return output;
}

// Main function to run the script
async function main() {
    const filePath = await askQuestion('Please enter the path to the file: ');

    // Remove quotes from the file path if any
    const normalizedFolderPath = path.normalize(filePath.replace(/^"|"$/g, ''));
    const MAX_SIZE = (parseInt(process.env.MAX_AVATAR_SIZE_KB, 10) || 150);

    try {
        const files = listFilesInDirectory(normalizedFolderPath).map(file => {
            if (file.isDirectory) {
                return {
                    name: file.name,
                    size: 0,
                    result: 'Directory'
                };
            }

            try {
                const fileBuffer = fs.readFileSync(file.path);
                const isValid = verifyBufferIsJPG(fileBuffer) ? 'Valid JPEG' : `Invalid JPEG or exceeds ${MAX_SIZE}KB`;
                
                return {
                    name: file.name,
                    size: file.size,
                    result: isValid
                };
            } catch (error) {
                return {
                    name: file.name,
                    size: 0,
                    result: `Error: ${error.message}`
                };
            }
        });

        console.log(formatOutput(files));
    } catch (error) {
        console.error('Error reading the directory:', error.message);
    }
}

// Run the main function
main();