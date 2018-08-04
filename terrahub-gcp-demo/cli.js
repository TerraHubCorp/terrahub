#!/usr/bin/env node

'use strict';

const path = require('path');
const semver = require('semver');
const logger = require('../src/helpers/logger');
const HelpParser = require('../src/helpers/help-parser');
const { engines } = require('../package');
const HelpCommand = require('../src/commands/.help');
const { commandsPath, config, args } = require('../src/parameters');

/**
 * Validate node version
 */
if (!semver.satisfies(process.version, engines.node)) {
  logger.warn(`Required Node version is ${engines.node}, current ${process.version}`);
  process.exit(1);
}

/**
 * Command create
 * @param {logger|*} logger
 * @returns {*}
 */
function commandCreate(logger = console) {
  const command = args._.shift();
  delete args._;

  if (!HelpParser.getCommandsNameList().includes(command) || config.isHelp
    || HelpParser.hasInvalidOptions(command, args)) {
    args.command = command;
    return new HelpCommand(args, logger);
  }

  const Command = require(path.join(commandsPath, command));
  return new Command(args, logger);
}

const command = commandCreate(logger);

command
  .validate()
  .then(() => command.run())
  .then(message => {
    if (message) {
      logger.info(message);
    }
    process.exit(0);
  })
  .catch(err => {
    logger.error(err || 'Error occurred');
    process.exit(1);
  });
