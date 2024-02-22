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

const emailTemplateFolder = path.join(__dirname, 'templates');

const mailTemplateStore = {
  email_verification_css: await fs.readFileSync(path.join(emailTemplateFolder, 'assets','email_verification_css.ejs'), 'utf8'),
  email_verification_light: await fs.readFileSync(path.join(emailTemplateFolder, 'email_verification_light.ejs'), 'utf8'),
}

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

const emailWorker = new Worker('q:mail', async (job) => {
  const userEmail = await GetUserData(job.data);
  switch (job.name) {
    case 'user:email_verification':
      // Send email verification
      console.log(`Sending email verification to ${userEmail}`);
      const renderdEmail = await ejs.render(mailTemplate, { });

      await emailtransporter.sendMail({
        from: `EBG - Webpanel <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Email Verification',
        html: renderdEmail,
        
      });
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
}, { connection: connection });