const path = require('path');
const fs = require('fs');

class AwsS3Store {
  /**
   * @example
   * const s3 = new S3Client({ region: 'YOUR_AWS_REGION', credentials: { accessKeyId: 'YOUR_ACCESS_KEY', secretAccessKey: 'YOUR_SECRET_ACCESS_KEY' } });
   * new AwsS3Store({ bucketName: 'example-bucket', remoteDataPath: 'example/remote/dir', s3Client: s3 })
   * @param {Object} options Specifies the params pattern.
   * @param {String} options.bucketName Specifies the S3 bucket name.
   * @param {String} options.remoteDataPath Specifies the remote path to save authentication files.
   * @param {Object} options.s3Client The S3Client instance after configuring the AWS SDK.
   * @param {Object} options.putObjectCommand  The PutObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.headObjectCommand  The HeadObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.getObjectCommand  The GetObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.deleteObjectCommand  The DeleteObjectCommand class from `@aws-sdk/client-s3`.
   */
  constructor({ bucketName, remoteDataPath, s3Client, putObjectCommand, headObjectCommand, getObjectCommand, deleteObjectCommand } = {}) {
    if (!bucketName) throw new Error("A valid bucket name is required for AwsS3Store.");
    if (!remoteDataPath) throw new Error("A valid remote dir path is required for AwsS3Store.");
    if (!s3Client) throw new Error("A valid S3Client instance is required for AwsS3Store.");
    this.bucketName = bucketName;
    this.remoteDataPath = remoteDataPath;
    this.s3Client = s3Client;
    this.putObjectCommand = putObjectCommand;
    this.headObjectCommand = headObjectCommand;
    this.getObjectCommand = getObjectCommand;
    this.deleteObjectCommand = deleteObjectCommand;
    this.debugEnabled = process.env.STORE_DEBUG === 'true';
  }

  async sessionExists(options) {
    this.debugLog('[METHOD: sessionExists] Triggered.');

    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      this.debugLog(`[METHOD: sessionExists] File found. PATH='${remoteFilePath}'.`);
      return true;
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.name === 'NotFound') {
        this.debugLog(`[METHOD: sessionExists] File not found. PATH='${remoteFilePath}'.`);
        return false;
      }
      this.debugLog(`[METHOD: sessionExists] Error: ${err.message}`);
      // throw err;
      return
    }
  }

  async save(options) {
    this.debugLog('[METHOD: save] Triggered.');

    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    options.remoteFilePath = remoteFilePath;
    await this.#deletePrevious(options);

    const fileStream = fs.createReadStream(`${options.session}.zip`);
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath,
      Body: fileStream
    };
    await this.s3Client.send(new this.putObjectCommand(params));

    this.debugLog(`[METHOD: save] File saved. PATH='${remoteFilePath}'.`);
  }

  async extract(options) {
    this.debugLog('[METHOD: extract] Triggered.');

    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    const fileStream = fs.createWriteStream(options.path);
    const response = await this.s3Client.send(new this.getObjectCommand(params));
    await new Promise((resolve, reject) => {
      response.Body.pipe(fileStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    this.debugLog(`[METHOD: extract] File extracted. REMOTE_PATH='${remoteFilePath}', LOCAL_PATH='${options.path}'.`);

  }

  async delete(options) {
    this.debugLog('[METHOD: delete] Triggered.');

    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      await this.s3Client.send(new this.deleteObjectCommand(params));
      this.debugLog(`[METHOD: delete] File deleted. PATH='${remoteFilePath}'.`);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.name === 'NotFound') {
        this.debugLog(`[METHOD: delete] File not found. PATH='${remoteFilePath}'.`);
        return;
      } 
      this.debugLog(`[METHOD: delete] Error: ${err.message}`);
      // throw err;
      return
    }
  }

  async #deletePrevious(options) {
    this.debugLog('[METHOD: #deletePrevious] Triggered.');

    const params = {
      Bucket: this.bucketName,
      Key: options.remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      await this.s3Client.send(new this.deleteObjectCommand(params));
      this.debugLog(`[METHOD: #deletePrevious] File deleted. PATH='${options.remoteFilePath}'.`);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.name === 'NotFound') {
        this.debugLog(`[METHOD: #deletePrevious] File not found. PATH='${options.remoteFilePath}'.`);
        return;
      }
      this.debugLog(`[METHOD: #deletePrevious] Error: ${err.message}`);
      // throw err;
      return
    }
  }

  debugLog(msg) {
    if (this.debugEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} [STORE_DEBUG] ${msg}`);
    }
  }
}

module.exports = { AwsS3Store };
