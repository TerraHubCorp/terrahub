'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');

class BuildCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('build')
      .setDescription('build code used by terraform configuration (e.g. AWS Lambda, Google Functions)')
      .addOption('format', 'o', 'Log only the command result in one of the following formats: json, text', String, '')
    ;
  }

  /**
   * @return {Promise}
   */
  run() {
    const format = this.getOption('format');
    const silent = this.getOption('silent');

    if (format && !['json', 'text'].includes(format)) {
      return Promise.reject(new Error(`The '${format}' output format is not supported for this command.`));
    }

    const config = this.getConfigObject();
    const distributor = new Distributor(config, { silent: silent, format: format });

    return distributor.runActions(['build'])
      .then(() => Promise.resolve(!['json'].includes(format) ? 'Done' : ''))
      .catch(err => ['json'].includes(format) ? Promise.resolve() : Promise.reject(err));
  }
}

module.exports = BuildCommand;
