'use strict';

const semver = require('semver');
const logger = require('../logger');
const Dictionary = require('../dictionary');
const BuildHelper = require('../build-helper');
const AbstractTerrahub = require('./abstract-terrahub');

class Terrahub extends AbstractTerrahub {
  /**
   * @param {Object} data
   * @param {Error|String} err
   * @return {Promise}
   * @private
   * @override
   */
  async on(data, err = null) {
    let error = null;
    let realtimePayload = {
      runId: this._runId,
      status: data.status,
      action: this._action,
      projectName: this._project.name,
      projectId: this._project.code.toString(),
      componentName: this._config.name,
      componentHash: this._componentHash,
      realtimeCreatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    if (this._action === 'init' && data.status === Dictionary.REALTIME.START && this.parameters.config.token) {
      await this.createComponent();
    }

    if (err) {
      error = err instanceof Error ? err : new Error(err || 'Unknown error');
      realtimePayload.error = JSON.stringify(error.message);
    }
    if (realtimePayload.action === 'plan' && data.status === Dictionary.REALTIME.SUCCESS) {
      realtimePayload.metadata = JSON.stringify(data.metadata);
    }

    if (this.parameters.config.token) {
      await this.parameters.fetch.post('realtime/create', { body: JSON.stringify(realtimePayload) });
    }

    return realtimePayload.hasOwnProperty('error') ? Promise.reject(error) : Promise.resolve(data);
  }

  /**
   * @return {Promise}
   * @protected
   * @override
   */
  checkProject() {
    if (!this.parameters.config.token) {
      return Promise.resolve();
    }

    const payload = {
      name: this._project.name,
      hash: this._project.code.toString()
    };
    return this.parameters.fetch.post('project/create', { body: JSON.stringify(payload) }).then((json) => {
      this._project.id = json.data.id;

      return Promise.resolve();
    });
  }

  /**
   * @return {Promise}
   * @private
   */
  createComponent() {
    const componentPayload = {
      projectName: this._project.name,
      projectId: this._project.code.toString(),
      runId: this._runId,
      name: this._config.name,
      hash: this._componentHash,
      componentStartedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    return this.parameters.fetch.post('component/create', { body: JSON.stringify(componentPayload) });
  }

  /**
   * @param {Object} data
   * @return {Promise}
   * @private
   * @abstract
   */
  async upload(data) {
    if (
      !this.parameters.config.token ||
      !data ||
      !data.buffer ||
      !['plan', 'apply', 'destroy'].includes(this._action)
    ) {
      return data;
    }

    const key = this._getKey();
    const url = `${Terrahub.METADATA_DOMAIN}/${key}`;
    const terraformVersion = this._config.terraform.version;

    if (semver.satisfies(terraformVersion, '>=0.12.0')) {
      if (this._action === 'plan') {
        const planAsJson = await this._terraform.show(this._terraform._metadata.getPlanPath());
        await this._putObject(url, planAsJson);
      } else {
        await this._putObject(url, data.buffer);
      }

      await this._callParseLambda(key, true);

      return data;
    }

    await this._putObject(url, data.buffer);
    await this._callParseLambda(key, false);

    return data;
  }

  /**
   * Get destination key
   * @return {String}
   * @private
   */
  _getKey() {
    const dir = this.parameters.config.api.replace('api', 'public');
    const keyName = `${this._componentHash}-terraform-${this._action}.txt`;
    return `${dir}/${this._timestamp}/${keyName}`;
  }

  /**
   * @param {String} key
   * @param {Boolean} isHcl2
   * @return {Promise}
   * @private
   */
  _callParseLambda(key, isHcl2) {
    const url = `resource/parse-${this._action}`;

    const options = {
      body: JSON.stringify({
        key,
        isHcl2,
        projectId: this._project.id,
        thubRunId: this._runId
      })
    };
    const promise = this.parameters.fetch.post(url, options).catch((error) => {
      const message = this._addNameToMessage('Failed to trigger parse function');

      logger.error({ ...error, message });

      return Promise.resolve();
    });

    return process.env.DEBUG ? promise : Promise.resolve();
  }

  /**
   * Put object via bucket url
   * @param {String} url
   * @param {Buffer|String} body
   * @return {Promise}
   * @private
   */
  async _putObject(url, body) {
    const options = {
      method: 'PUT',
      body: body,
      headers: { 'Content-Type': 'text/plain', 'x-amz-acl': 'bucket-owner-full-control' }
    };

    return this.parameters.fetch.request(url, options);
  }

  /**
   * @param {Object} config
   * @param {String} thubRunId
   * @param {String[]} actions
   * @return {Function[]}
   */
  getTasks({ config, thubRunId, actions } = {}) {
    const { distributor } = config;

    logger.updateContext({
      runId: thubRunId,
      componentName: config.name
    });

    return actions.map((action) => (options) => {
      logger.updateContext({ action: action });

      return action !== 'build'
        ? this.getTask(action, options)
        : BuildHelper.getComponentBuildTask(config, distributor);
    });
  }

  /**
   * Metadata bucket associated domain
   * @return {String}
   * @constructor
   */
  static get METADATA_DOMAIN() {
    return `https://${process.env.THUB_BUCKET || 'api.tfxor.com'}.s3.amazonaws.com`;
  }
}

module.exports = Terrahub;
