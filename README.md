# wwebjs-aws-s3
A remote authentication plugin for [whatsapp-web.js](https://wwebjs.dev/). Use the AWS S3 to keep your WhatsApp MultiDevice session data safe and secure.

![GitHub license](https://img.shields.io/github/license/arbisyarifudin/wwebjs-aws-s3.svg) [![npm version](https://badge.fury.io/js/wwebjs-aws-s3.svg)](https://badge.fury.io/js/wwebjs-aws-s3)
[![npm downloads](https://img.shields.io/npm/dm/wwebjs-aws-s3.svg)](https://npm-stat.com/charts.html?package=wwebjs-aws-s3)
![GitHub issues](https://img.shields.io/github/issues/arbisyarifudin/wwebjs-aws-s3.svg)

## Quick Links

* [Whatsapp-web JS](https://wwebjs.dev/guide/authentication.html)
* [GitHub](https://github.com/arbisyarifudin/wwebjs-aws-s3)
* [npm](https://www.npmjs.com/package/wwebjs-aws-s3)

## Installation

The module is now available on npm! `npm i wwebjs-aws-s3`

## DEBUG mode

To see detailed logs about object health, set the environment variable STORE_DEBUG to "true".

```bash
# linux
$ export STORE_DEBUG=true

# windows
$ SET STORE_DEBUG=true
```

## Example usage

```js
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
        clientId: 'yourSessionName',
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
```

## Delete Remote Session

How to force delete a specific remote session on the Database:

```js
await store.delete({session: 'yourSessionName'});
```