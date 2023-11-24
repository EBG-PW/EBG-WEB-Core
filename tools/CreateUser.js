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
    const username = await askQuestion("Type your username: ");
    const email = await askQuestion("Type your email: ");
    const lang = await askQuestion("Type your language (2 letter code): ");
    const password = await askQuestion("Type your password: ");
    const extraVerify = await askQuestion("Would you like to add 2FA to this account? (y/n): ");

    if (password.length < 8) { throw new Error("Password must be at least 8 characters long!") };
    if (password.length > 50) { throw new Error("Password must be at most 50 characters long!") };

    bcrypt.hash(password, SALTROUNDS, async function (err, password_hash) {
        if (err) { throw new Error(err) };
        if (extraVerify.toLowerCase() === "y") {

            const secret2fa = twofactor.generateSecret({ name: process.env.application, account: username });
            qrcode.generate(secret2fa.uri, { small: true });
            const code2fa = await askQuestion("Type your 2fa code: ");

            const delta = twofactor.verifyToken(secret2fa.secret, code2fa);

            if (delta.delta === 0) {
                Promise.all([user.create(username, email, password_hash, lang.toLowerCase(), "dark", default_group, secret2fa.secret)]).then(function (result) {
                    console.log("\n\nAdmin User created!\n\n")
                    process.exit(0);
                }).catch(function (error) {
                    console.log(error);
                })
            } else {
                throw new Error("2FA Token is not valid!")
            }
        } else {
            Promise.all([user.create(username, email, password_hash, lang.toLowerCase(), "dark", default_group)]).then(() => {
                console.log("\n\nAdmin User created!")
                process.exit(0);
            }).catch(err => {
                console.log(err)
                process.exit(1);
            });
        }
    });
}

Questions()