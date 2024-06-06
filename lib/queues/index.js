const { Queue, QueueEvents } = require('bullmq');
const randomstring = require('randomstring');

const getSlug = (length = 10) => {
    return randomstring.generate({ length, charset: 'alphanumeric' });
};

const mail_q_types = ["user:email_verification", "user:login", "user:reset_password"]

const connection = {
    port: parseInt(process.env.REDIS_USER) || 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    username: process.env.REDIS_USER || "default",
    password: process.env.REDIS_PASSWORD || "default",
    db: parseInt(process.env.REDIS_DB) + 1 || 1,
};

const mail_q = new Queue('q:mail', { connection: connection });
const mail_qEvents = new QueueEvents('q:mail', { connection: connection });

/**
 * Add a send Mail request to the queue, if true is passed for waitForCompletion, it will wait for the job to complete
 * @param {String} emailType 
 * @param {Type} emailResiver 
 * @param {Boolean} waitForCompletion 
 * @returns 
 */
const sendMail = async (emailType, emailResiver, waitForCompletion = false) => {
    if (!emailResiver) throw new Error('Email receiver is required');
    if (!mail_q_types.includes(emailType)) {
        throw new Error(`Invalid email type: ${emailType}`);
    }
    const jobId = `${emailType}-${Date.now()}:${getSlug(6)}`;
    await mail_q.add(emailType, emailResiver, { jobId });

    if (!waitForCompletion) {
        // If not waiting for completion, resolve immediately
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const onCompleted = async (jobIdCompleted) => {
            if (jobIdCompleted === jobId) {
                mail_qEvents.off('completed', onCompleted); // Clean up listener
                resolve();
            }
        };

        mail_qEvents.on('completed', onCompleted);

        mail_qEvents.on('failed', (jobIdFailed, failedReason) => {
            if (jobIdFailed === jobId) {
                mail_qEvents.off('completed', onCompleted); // Clean up listener
                reject(new Error(`Email job ${jobId} failed`));
            }
        });
    });
}

module.exports = {
    sendMail
};