const Joi = require('joi');
const HyperExpress = require('hyper-express');
const { limiter } = require('@middleware/limiter');
const { S3ErrorRead } = require('@lib/errors');
const fs = require('fs');
const path = require('path');
const router = new HyperExpress.Router();
const Minio = require('minio');

// Initialize MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.S3_WEB_ENDPOINT,
    port: parseInt(process.env.S3_WEB_PORT),
    useSSL: process.env.S3_WEB_USESSL === 'true',
    accessKey: process.env.S3_WEB_ACCESSKEY,
    secretKey: process.env.S3_WEB_SECRETKEY
});

// \public\dist\img\avatar\default_avatar.jpg"
const defaultAvatar = fs.readFileSync(path.join(__dirname, '..', 'public', 'dist', 'img', 'avatar', 'default_avatar.jpg'));

const uuidCheck = Joi.object({
    puuid: Joi.string().guid({ version: 'uuidv4' }).required(),
});

router.get('/a', limiter(1), async (req, res) => {
    res.header('Content-Type', 'image/jpeg');
    res.send(defaultAvatar);
});

router.get('/a/:puuid', limiter(1), async (req, res) => {
    const { puuid } = await uuidCheck.validateAsync(req.params);

    const stream = await new Promise((resolve, reject) => {
        minioClient.getObject(process.env.S3_WEB_BUCKET, `ua:${puuid}.jpg`, (err, stream) => {
            if (err) {
                reject(new S3ErrorRead(err, process.env.S3_WEB_BUCKET, `ua:${puuid}s.jpg`).withStatus(404));
            } else {
                resolve(stream);
            }
        });
    });

    stream.pipe(res);
});

module.exports = router;