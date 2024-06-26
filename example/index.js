const { AwsS3Store, S3Client } = require('../src/AwsS3Store');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const s3 = new S3Client({
    region: 'AWS_REGION',
    credentials: {
        accessKeyId: 'AWS_ACCESS_KEY_ID',
        secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
    },
    httpOptions: {
        timeout: 600000, // 10 minutes <-- increase this value for large file uploads
    },
});

const store = new AwsS3Store({
    bucketName: 'example-bucket',
    remoteDataPath: 'example/dir',
    s3Client: s3
});

const client = new Client({
    authStrategy: new RemoteAuth({
        clientId: 'session-123',
        dataPath: './.wwebjs_auth',
        store: store,
        backupSyncIntervalMs: 600000 // in milliseconds (10 minutes) <-- decrease this value if you want to test the backup feature
    })
});


client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');

    // trigger whatsapp client is started and ready
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

// it will done early (so use event 'ready' listener to know when the whatsapp client is ready & started)
client.initialize();
