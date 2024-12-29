const amqp = require('amqplib');

const mail_q_types = ["user:email_verification", "user:login", "user:reset_password"];

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'q_mail';

let connection;
let channel;

// Initialize RabbitMQ connection and channel
const initRabbitMQ = async () => {
    if (!connection) {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
    }
};

/**
 * Add a send Mail request to the RabbitMQ queue
 * @param {String} type 
 * @param {Number} receiverId
 * @param {Object} data
 * @returns {Promise<void>} Resolves when the message is sent to RabbitMQ
 */
const sendMail = async (type, receiverId, data) => {
    if (!receiverId) throw new Error('Email receiver is required');
    if (!data) throw new Error('Data is required');
    if (!mail_q_types.includes(type)) {
        throw new Error(`Invalid email type: ${type}`);
    }

    const message = {
        type,
        receiverId,
        data,
        timestamp: Date.now(),
    };

    await initRabbitMQ();

    return new Promise((resolve, reject) => {
        try {
            channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
                persistent: true, 
            });
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

process.on('exit', async () => {
    if (channel) await channel.close();
    if (connection) await connection.close();
});

module.exports = {
    sendMail
};
