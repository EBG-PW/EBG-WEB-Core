require('dotenv').config();
require('module-alias/register')

const port = process.env.PORT || 80;
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

const { log } = require('@lib/logger');

const path = require('path');
const fs = require('fs');

process.log = {};
process.log = log;

const { Worker } = require('bullmq');
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const { WriteConfirmationToken, GetUserData } = require('@lib/postgres');
const { generateOneTimePassword, generateUrlPath } = require('@lib/util');
const { addConfirmationToken } = require('@lib/redis');
const { convertPngFilesToBase64 } = require('@lib/template');

const emailTemplateFolder = path.join(__dirname, 'templates');

const mailTemplateStore = {
  base64images: {},
  email_verification_css: fs.readFileSync(path.join(emailTemplateFolder, 'assets', 'theme.css'), 'utf8'),
  email_verification_light: fs.readFileSync(path.join(emailTemplateFolder, 'email_verification_light.ejs'), 'utf8'),
};

const translationStore = {
  de: require(path.join(emailTemplateFolder, 'lang', 'de.json')),
};

const connection = {
  port: parseInt(process.env.Redis_Port) || 6379,
  host: process.env.Redis_Host || "127.0.0.1",
  username: process.env.Redis_User || "default",
  password: process.env.Redis_Password || "default",
  db: parseInt(process.env.Redis_DB) + 1 || 1,
};

const emailtransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

(async () => {
  // Load email template images
  mailTemplateStore.base64images = await convertPngFilesToBase64(path.join(emailTemplateFolder, 'assets'));

  const emailWorker = new Worker('q:mail', async (job) => {
    const userData = await GetUserData(job.data.userId);
    const urlPath = job.data.urlPath;
    const appDomain = job.data.appDomain;
    const oneTimePassword = generateOneTimePassword();
    switch (job.name) {
      case 'user:email_verification':
        // Render Email
        const renderdEmail = await ejs.render(mailTemplateStore.email_verification_light, {
          css: mailTemplateStore.email_verification_css,
          images: mailTemplateStore.base64images,
          username: userData.username,
          lang: translationStore[userData.language],
          registerCode: oneTimePassword,
          regUrl: `${appDomain}/api/v1/register/${urlPath}`,
        });
      
        // Send email verification
        await emailtransporter.sendMail({
          from: `EBG - Webpanel <${process.env.SMTP_USER}>`,
          to: userData.email,
          subject: translationStore[userData.language].subject.registerCode,
          html: renderdEmail,
        });

        // Add one time password to redis
        await addConfirmationToken(urlPath, job.data.userId);
        break;
      case 'user:login':
        // Send login email
        break;
      case 'user:reset_password':
        // Send reset password email
        break;
      default:
        throw new Error(`Invalid email type: ${job.name}`);
    }

    return;
    // Simulate email sending
  }, { 
    connection: connection,
    removeOnComplete: { count: 1 },
    removeOnFail: { count: 50 },
  });
})();