'use strict';

const AWS = require('aws-sdk');
const fse = require('fs-extra');
const ApiHelper = require('./api-helper');
const { prepareCredentialsFile, createCredentialsFile } = require('./util');

class S3Helper {
  /**
   *
   */
  constructor() {
    this._s3 = new AWS.S3();
  }

  /**
   * Create s3 object
   * @param {String} bucketName
   * @param {String} objectKey
   * @param {Buffer|Blob|String|ReadableStream} body
   * @returns {Promise}
   */
  writeFile(bucketName, objectKey, body = '') {
    return this._s3.putObject({ Bucket: bucketName, Key: objectKey, Body: body }).promise();
  }

  /**
   * @param {String} bucketName
   * @param {{ localPath: String, s3Path: String }[]} pathMap
   * @return {Promise}
   */
  uploadFiles(bucketName, pathMap) {
    return Promise.all(pathMap.map(path =>
      this.writeFile(bucketName, path.s3Path, fse.createReadStream(path.localPath))
    ));
  }

  /**
   * Get s3 object
   * @param {String} bucketName
   * @param {String} objectKey
   * @param {Object} config
   * @returns {Promise}
   */
  getObject(bucketName, objectKey, config) {
    if (!process.env.THUB_TOKEN_IS_VALID.length) {
      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    }

    return this._retriveCredsForTfVars(config).then(credsPath => {
      if (credsPath) {
        ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_PROFILE', 'AWS_SDK_LOAD_CONFIG']
          .forEach(it => delete process.env[it]);

        AWS.config.credentials = new AWS.SharedIniFileCredentials({ filename: credsPath, preferStaticCredentials: true });

        this._s3 = new AWS.S3();
      }

      return this._s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    });
  }

  /**
   * @param {Object} [config]
   * @return {Promise}
   * @private
   */
  _retriveCredsForTfVars(config) {
    if (!config) {
      return Promise.resolve();
    }
    const { tfvarsAccount } = config.terraform;

    return this._findCloudAccount(tfvarsAccount, config);
  }

  /**
   * @param {String} tfvarsAccount
   * @param {Object} config
   * @return {Promise}
   * @private
   */
  async _findCloudAccount(tfvarsAccount, config) {
    if (!tfvarsAccount) {
      return Promise.resolve();
    }

    const cloudAccounts = await ApiHelper.retrieveCloudAccounts();
    const accountData = cloudAccounts.aws && cloudAccounts.aws.find(it => it.name === tfvarsAccount);

    if (!accountData) {
      return Promise.resolve();
    }

    const sourceProfile = accountData.type === 'role'
      ? cloudAccounts.aws.find(it => it.id === accountData.env_var.AWS_SOURCE_PROFILE.id) : null;

    const credentials = prepareCredentialsFile({ accountData, sourceProfile, tfvars: true });
    const credsPath = createCredentialsFile(credentials, config, 'tfvars');

    return Promise.resolve(credsPath);
  }

  /**
   * Metadata bucket name
   * @returns {String}
   * @constructor
   */
  static get METADATA_BUCKET() {
    return 'data-lake-terrahub-us-east-1';
  }
}

module.exports = S3Helper;
