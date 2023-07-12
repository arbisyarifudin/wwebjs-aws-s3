# wwebjs-aws-s3
An AWS S3 plugin for whatsapp-web.js (used to "RemoteAuth").

Use the AWS S3 protocol to keep your WhatsApp MultiDevice session on a AWS S3 server.

## Quick Links

* [Whatsapp-web JS](https://wwebjs.dev/guide/authentication.html)
* [GitHub](https://github.com/arbisyarifudin/wwebjs-aws-s3)
* [npm](https://www.npmjs.com/package/wwebjs-aws-s3)

## Installation

The module is now available on npm! `npm i wwebjs-aws-s3`

## DEBUG mode

To see detailed logs about object health, set the environment variable DEBUG to "true".

```bash
# linux
$ export DEBUG=true

# windows
$ SET DEBUG=true
```

## Example usage

```js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { AwsS3Store } = require('wwebjs-aws-s3');
const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
  region: 'AWS_REGION',
  credentials: {
    accessKeyId: 'AWS_ACCESS_KEY_ID',
    secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
  }
});

const putObjectCommand = PutObjectCommand; 
const headObjectCommand = HeadObjectCommand;
const deleteObjectCommand = DeleteObjectCommand; 

const store = new AwsS3Store({
  bucketName: 'example-bucket',
  remoteDataPath: 'example/path/',
  s3Client: s3,
  putObjectCommand,
  headObjectCommand,
  deleteObjectCommand
});


const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 600000
    })
});

client.initialize();
```

## Delete Remote Session

How to force delete a specific remote session on the Database:

```js
await store.delete({session: 'yourSessionName'});
```