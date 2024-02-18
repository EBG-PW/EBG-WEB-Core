require('dotenv').config();
require('module-alias/register')

const port = process.env.PORT || 80;
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

const { log } = require('@lib/logger');

const fs = require('fs');

process.log = {};
process.log = log;

const { Worker } = require('bullmq');
const { WriteConfirmationToken, GetUserEmail } = require('@lib/postgres');

const connection = {
    port: parseInt(process.env.Redis_Port) || 6379,
    host: process.env.Redis_Host || "127.0.0.1",
    username: process.env.Redis_User || "default",
    password: process.env.Redis_Password || "default",
    db: parseInt(process.env.Redis_DB) + 1 || 1,
};

const emailWorker = new Worker('q:mail', async (job) => {
  const userEmail = await GetUserEmail(job.data);
  switch (job.name) {
    case 'user:email_verification':
      // Send email verification
      console.log(`Sending email verification to ${userEmail}`);
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
  // Simulate email sending
}, { connection: connection });