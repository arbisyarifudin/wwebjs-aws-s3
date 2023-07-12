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
   * @param {Object} options.putObjectCommand Optional. The PutObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.headObjectCommand Optional. The HeadObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.deleteObjectCommand Optional. The DeleteObjectCommand class from `@aws-sdk/client-s3`.
   */
  constructor({ bucketName, remoteDataPath, s3Client, putObjectCommand, headObjectCommand, deleteObjectCommand } = {}) {
    if (!bucketName) throw new Error("A valid bucket name is required for AwsS3Store.");
    if (!remoteDataPath) throw new Error("A valid remote dir path is required for AwsS3Store.");
    if (!s3Client) throw new Error("A valid S3Client instance is required for AwsS3Store.");
    this.bucketName = bucketName;
    this.remoteDataPath = remoteDataPath;
    this.s3Client = s3Client;
    this.putObjectCommand = putObjectCommand;
    this.headObjectCommand = headObjectCommand;
    this.deleteObjectCommand = deleteObjectCommand;
  }

  async sessionExists(options) {
    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      return true;
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        return false;
      } else if (err.name === 'NotFound') {
        return false;
      }
      return false
    }
  }

  async save(options) {
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
  }

  async extract(options) {
    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    const fileStream = fs.createWriteStream(options.path);
    const response = await this.s3Client.send(new this.headObjectCommand(params));
    await new Promise((resolve, reject) => {
      response.Body.pipe(fileStream)
        .on('error', reject)
        .on('close', resolve);
    });
  }

  async delete(options) {
    const remoteFilePath = path.join(this.remoteDataPath, `${options.session}.zip`).replace(/\\/g, '/');
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      await this.s3Client.send(new this.deleteObjectCommand(params));
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        return;
      }
      // throw err;
      return;
    }
  }

  async #deletePrevious(options) {
    const params = {
      Bucket: this.bucketName,
      Key: options.remoteFilePath
    };
    try {
      await this.s3Client.send(new this.headObjectCommand(params));
      await this.s3Client.send(new this.deleteObjectCommand(params));
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        return;
      }
      // throw err;
      return;
    }
  }
}

module.exports = { AwsS3Store };
