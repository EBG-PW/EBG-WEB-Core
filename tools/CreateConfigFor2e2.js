const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('module-alias/register')

const twofactor = require("node-2fa");
const fs = require("fs");
const readline = require('readline');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const { user } = require('@lib/postgres');

if (isNaN(parseInt(process.env.SaltRounds, 10))) {
    console.log(".env was not found!")
}

const usersToCreate = ["Admin", "Admin_2fa", "User"];

const SaltRounds = parseInt(process.env.SaltRounds, 10);

let generated_config = {}

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

(async function () {
    const create = await askQuestion("Would you like to create new test users? (y/n): ");
    if (create.toLowerCase() === "y") {
        for (let i = 0; i < usersToCreate.length; i++) {
            const type = usersToCreate[i];
            const username = `Test${usersToCreate[i]}`;
            const password = randomstring.generate({
                length: 22,
                charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
            });

            const lang = "de";

            bcrypt.hash(password, SaltRounds, async function (err, password_hash) {
                if (err) { throw new Error(err) };

                if (type === "Admin_2fa") {

                    const secret2fa = twofactor.generateSecret({ name: "E2E Test Account", account: username });

                    await Promise.all([user.create(username, password_hash, lang.toLowerCase(), secret2fa.secret), user.permission.add(username, "*", true, true)]).then(function (result) {
                        console.log("\nAdmin 2FA User created!")
                        generated_config[username] = {
                            username: username,
                            password: password,
                            factor2: secret2fa.secret,
                            lang: lang
                        }
                    }).catch(function (error) {
                        console.log(error);
                        process.exit(1);
                    })

                } else if (type === "Admin") {

                    await Promise.all([user.create(username, password_hash, lang), user.permission.add(username, "*", true, true)]).then(() => {
                        console.log("\nAdmin User created!")
                        generated_config[username] = {
                            username: username,
                            password: password,
                            lang: lang
                        }
                    }).catch(err => {
                        console.log(err)
                        process.exit(1);
                    });

                } else if (type === "User") {

                    await Promise.all([user.create(username, password_hash, lang), user.permission.add(username, "app.web.login", true, true)]).then(() => {
                        console.log("\nUser created!")
                        generated_config[username] = {
                            username: username,
                            password: password,
                            lang: lang
                        }
                    }).catch(err => {
                        console.log(err)
                        process.exit(1);
                    });

                }
            });
        }
    } else {
        console.log("No users created!")
        process.exit(0);
    }
}());

setInterval(() => {
    if (Object.keys(generated_config).length >= 3) {
        console.log("All users created!")
        fs.writeFileSync(path.join(__dirname, '..', 'e2e-test', 'config.json'), JSON.stringify(generated_config, null, 4));
        process.exit(0);
    }
}, 100);