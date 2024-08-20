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
const i18next = require('i18next');
const { GetUserData } = require('@lib/postgres');
const { replacePlaceholders } = require('@lib/util');
const { addConfirmationToken, addResetPasswordToken } = require('@lib/redis');

const emailTemplateFolder = path.join(__dirname, 'templates');

const mailTemplateStore = {};

fs.readdirSync(emailTemplateFolder).forEach((file) => {
  if (path.extname(file) === '.js') {
    const filename = path.basename(file, '.js');
    mailTemplateStore[filename] = require(path.join(emailTemplateFolder, file));
  }
});


const translationStore = {
  de: require(path.join(emailTemplateFolder, 'lang', 'de.json')),
  en: require(path.join(emailTemplateFolder, 'lang', 'en.json')),
};

const connection = {
  port: parseInt(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST || "127.0.0.1",
  username: process.env.REDIS_USER || "default",
  password: process.env.REDIS_PASSWORD || "default",
  db: parseInt(process.env.REDIS_DB) + 1 || 1,
};

const emailtransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
});

(async () => {
  await i18next.init({
    lng: 'de',
    fallbackLng: 'de',
    resources: translationStore,
  });

  const emailWorker = new Worker('q:mail', async (job) => {
    try {
      const userData = await GetUserData(job.data.userId);
      let emailText;

      process.log.debug(`Sending email to ${userData.email} with type: ${job.name}`);

      const lang = userData.language || process.env.FALLBACKLANG;
          const t = i18next.getFixedT(lang);

      switch (job.name) {
        case 'user:email_verification':
          emailText = mailTemplateStore.email_verification_text.generate(t, {
            username: userData.username,
            regUrl: `${job.data.appDomain}/api/v1/register/${job.data.urlPath}`
          });

          await emailtransporter.sendMail({
            from: `${process.env.COMPANYNAME} - Webpanel <${process.env.SMTP_USER}>`,
            to: userData.email,
            subject: t('subject.registerMail', { companyName: process.env.COMPANYNAME }),
            text: emailText,
          });
          
          await addConfirmationToken(job.data.urlPath, job.data.userId);
          break;
        case 'user:login':
          // Send login email
          break;
        case 'user:reset_password':
          const emailText = mailTemplateStore.email_passwordReset_text.generate(t, {
            username: userData.username,
            regUrl: `${job.data.appDomain}/api/v1/register/${job.data.urlPath}`
          });

          // Send email verification
          await emailtransporter.sendMail({
            from: `${process.env.COMPANYNAME} - Webpanel <${process.env.SMTP_USER}>`,
            to: userData.email,
            subject: t('subject.passwordReset', { companyName: process.env.COMPANYNAME }),
            text: emailText,
          });

          // Add password reset token to Redis
          await addResetPasswordToken(job.data.urlPath, job.data.userId);
          break;
        default:
          throw new Error(`Invalid email type: ${job.name}`);
      }

    } catch (error) {
      process.log.error(error);
      process.log.error(JSON.stringify(job.data));
      throw error;
    }

    return;
  }, {
    connection: connection,
    removeOnComplete: { count: 1 },
    removeOnFail: { count: 50 },
  });
})();