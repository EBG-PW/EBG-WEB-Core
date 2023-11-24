const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('module-alias/register')
const readline = require('readline');
const bcrypt = require('bcrypt');
const twofactor = require("node-2fa");
const qrcode = require('qrcode-terminal');
const { user } = require('@lib/postgres');
const { default_group } = require('@config/permissions');

if (isNaN(parseInt(process.env.SALTROUNDS, 10))) {
    console.log(".env was not found!")
}

const SALTROUNDS = parseInt(process.env.SALTROUNDS, 10);

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function Questions() {
    const password = await askQuestion("Type your password: ");

    if (password.length < 8) { throw new Error("Password must be at least 8 characters long!") };
    if (password.length > 50) { throw new Error("Password must be at most 50 characters long!") };

    bcrypt.hash(password, SALTROUNDS, async function (err, password_hash) {
        if (err) { throw new Error(err) };

        console.log(password_hash)
    });
}

Questions()