# wwebjs-aws-s3
A remote authentication plugin for [whatsapp-web.js](https://wwebjs.dev/). Use the AWS S3 to keep your WhatsApp MultiDevice session data safe and secure.

![GitHub stars](https://img.shields.io/github/stars/arbisyarifudin/wwebjs-aws-s3.svg?style=social&label=Star&maxAge=2592000) ![GitHub license](https://img.shields.io/github/license/arbisyarifudin/wwebjs-aws-s3.svg)

[![npm version](https://badge.fury.io/js/wwebjs-aws-s3.svg)](https://badge.fury.io/js/wwebjs-aws-s3)
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
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { AwsS3Store } = require('wwebjs-aws-s3');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
  region: 'AWS_REGION',
  credentials: {
    accessKeyId: 'AWS_ACCESS_KEY_ID',
    secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
  }
});

const putObjectCommand = PutObjectCommand; 
const headObjectCommand = HeadObjectCommand;
const getObjectCommand = GetObjectCommand;
const deleteObjectCommand = DeleteObjectCommand; 

const store = new AwsS3Store({
  bucketName: 'example-bucket',
  remoteDataPath: 'example/path/',
  s3Client: s3,
  putObjectCommand,
  headObjectCommand,
  getObjectCommand,
  deleteObjectCommand
});


const client = new Client({
    authStrategy: new RemoteAuth({
        clientId: 'yourSessionName',
        dataPath: './.wwebjs_auth',
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