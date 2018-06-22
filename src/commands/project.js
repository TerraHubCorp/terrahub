'use strict';

const fs = require('fs');
const path = require('path');
const AbstractCommand = require('../abstract-command');
const { templates, config } = require('../parameters');
const { renderTwig, toMd5, isAwsNameValid } = require('../helpers/util');

class ProjectCommand extends AbstractCommand {
  /**
   * Command configuration
   */
  static get name() {
    return 'project';
  }

  static get description() {
    return 'create or update project that manages multiple terraform scripts';
  }

  static get options() {
    return super.options
      .addOption('name', 'n', 'Project name', String)
      .addOption('provider', 'p', 'Cloud provider', String, 'aws')
      .addOption('directory', 'd', 'Path where project should be created (default: cwd)', String, process.cwd());
  }

  /**
   * @returns {Promise}
   */
  run() {
    const name = this.getOption('name');
    const provider = this.getOption('provider');
    const directory = path.resolve(this.getOption('directory'));
    const code = this._code(name, provider);

    if (!isAwsNameValid(name)) {
      throw new Error('Name is not valid, only letters, numbers, hyphens, or underscores are allowed');
    }

    return this._isCodeValid(code).then(valid => {
      if (!valid) {
        throw new Error('Project code has collisions');
      }

      const srcFile = path.join(templates.configs, 'project', `.terrahub.${config.format}.twig`);
      const outFile = path.join(directory, `.terrahub.${config.format}`);

      if (fs.existsSync(outFile)) {
        this.logger.warn(`Project already configured`);
        return Promise.resolve();
      }

      return renderTwig(srcFile, { name, provider, code }, outFile).then(() => {
        return Promise.resolve('Project successfully initialized');
      });
    });
  }

  /**
   * Check project code for collisions
   * @param {String} code
   * @returns {Promise}
   * @private
   */
  _isCodeValid(code) {
    if (!config.token) {
      return Promise.resolve(true);
    }

    // @todo call API and check code collisions
    return Promise.resolve(true);
  }

  /**
   * Generate project code
   * @param {String} name
   * @param {String} provider
   * @returns {String}
   * @private
   */
  _code(name, provider) {
    return toMd5(name + provider).slice(0, 8);
  }
}

module.exports = ProjectCommand;
