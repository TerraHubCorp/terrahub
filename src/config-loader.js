'use strict';

const os = require('os');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { config } = require('./parameters');
const { toMd5, extend, yamlToJson, jsonToYaml } = require('./helpers/util');

class ConfigLoader {
  /**
   * Constructor
   */
  constructor() {
    this._config = {};
    this._rootPath = false;
    this._rootConfig = {};
    this._projectConfig = {};

    /**
     * Initialisation
     */
    this._readRoot();
  }

  /**
   * Component default config
   * @returns {Object}
   * @private
   */
  _defaults() {
    return {
      project: this.getProjectConfig(),
      parent: null,
      children: [],
      hooks: {},
      build: {}
    };
  }

  /**
   * Read root config
   * @private
   */
  _readRoot() {
    const cfgPaths = this._findRootConfigs(process.cwd());

    switch (cfgPaths.length) {
      case 1: {
        this._rootPath = cfgPaths[0];
        this._rootConfig = this._getConfig(path.join(this._rootPath, config.defaultFileName));
        this._projectConfig = Object.assign({ root: this._rootPath }, this._rootConfig['project']);

        delete this._rootConfig['project'];
        break;
      }

      case 0: {
        this._rootPath = false;
        this._rootConfig = {};
        this._projectConfig = {};

        break;
      }

      default: {
        let errorMsg = 'Multiple root configs identified in this project:' + os.EOL;

        cfgPaths.forEach((cfgPath, index) => {
          errorMsg += `  ${index + 1}. ${cfgPath}` + os.EOL;
        });

        errorMsg += 'ONLY 1 root config per project is allowed. Please remove all the other and try again.';

        throw new Error(errorMsg);
      }
    }
  }

  /**
   * @param {String} dirPath
   * @return {String[]}
   * @private
   */
  _findRootConfigs(dirPath) {
    const lower = path.resolve(dirPath, '..');
    let result;

    if (lower !== dirPath) {
      result = this._findRootConfigs(lower);
    } else {
      result = [];
    }

    let cfgFile;
    try {
      cfgFile = yamlToJson(path.join(dirPath, config.defaultFileName));
    } catch (error) {
      cfgFile = {};
    }

    if (cfgFile.hasOwnProperty('project')) {
      result.push(dirPath);
    }

    return result;
  }

  /**
   * Get application root directory
   * @returns {String|Boolean}
   */
  appPath() {
    return this._rootPath;
  }

  /**
   * Get project config
   * @returns {Object}
   */
  getProjectConfig() {
    return this._projectConfig;
  }

  /**
   * Get centralized application config
   * @returns {Object}
   */
  getFullConfig() {
    if (!Object.keys(this._config).length) {
      this._handleRootConfig();
      this._handleComponentConfig();
    }

    return this._config;
  }

  /**
   * Get list of configuration files
   * @param {*} dir
   * @returns {Array}
   */
  listConfig(dir = false) {
    const searchPath = dir || this.appPath();

    return searchPath ? this._find('**/.terrahub.+(json|yml|yaml)', searchPath) : [];
  }

  /**
   * Count of configured components
   * @returns {Number}
   */
  componentsCount() {
    return Object.keys(this.getFullConfig()).length;
  }

  /**
   * Separate root config from component's config
   * @private
   */
  _handleRootConfig() {
    Object.keys(this._rootConfig).forEach(key => {
      const cfg = this._rootConfig[key];

      if (cfg.hasOwnProperty('root')) {
        const root = this.relativePath(path.join(this.appPath(), cfg.root));

        cfg.root = root;
        this._config[this.getComponentHash(root)] = cfg;
        delete this._rootConfig[key];
      }
    });

    Object.keys(this._config).forEach(module => {
      this._config[module] = extend({}, [this._defaults(), this._rootConfig, this._config[module]]);
    });
  }

  /**
   * Consolidate all components' config
   * @private
   */
  _handleComponentConfig() {
    // Remove root config
    const config = this.listConfig().slice(1);

    config.forEach(configPath => {
      let config = this._getConfig(configPath);
      const componentPath = path.dirname(this.relativePath(configPath));
      const componentHash = this.getComponentHash(componentPath);

      // Delete in case of delete
      config = Object.assign(config, config.component);
      delete config.component;

      if (config.hasOwnProperty('parent')) {
        config['parent'] = this.relativePath(path.resolve(this._rootPath, componentPath, config.parent));
      }

      this._config[componentHash] = extend({ root: componentPath }, [this._defaults(), this._rootConfig, config]);
    });
  }

  /**
   * Build component hash
   * @param {String} fullPath
   * @returns {String}
   */
  getComponentHash(fullPath) {
    return toMd5(this.relativePath(fullPath));
  }

  /**
   * Find files by pattern
   * @param {String} pattern
   * @param {String} path
   * @returns {*}
   * @private
   */
  _find(pattern, path) {
    return glob.sync(pattern, { cwd: path, absolute: true, dot: true, ignore: ConfigLoader.IGNORE_PATTERNS });
  }

  /**
   * @param {String} fullPath
   * @returns {*}
   */
  relativePath(fullPath) {
    return fullPath.replace(this.appPath(), '.');
  }

  /**
   * @param {String} key
   * @param {String} value
   */
  addToGlobalConfig(key, value) {
    const cfgPath = path.join(this._rootPath, config.defaultFileName);
    const cfg = ConfigLoader.readConfig(cfgPath);

    cfg.project[key] = value;

    ConfigLoader.writeConfig(cfg, cfgPath);
  }

  /**
   * Updates root config
   */
  updateRootConfig() {
    this._readRoot();
  }

  /**
   * Get environment specific config
   * @param {String} cfgPath
   * @returns {*}
   * @private
   */
  _getConfig(cfgPath) {
    const cfg = ConfigLoader.readConfig(cfgPath);
    const envPath = path.join(path.dirname(cfgPath), config.fileName);
    const forceWorkspace = { terraform: { workspace: config.env } }; // Just remove to revert
    const overwrite = (objValue, srcValue) => {
      if (Array.isArray(objValue)) {
        return srcValue;
      }
    };

    return (fs.existsSync(envPath) && !config.isDefault)
      ? extend(cfg, [ConfigLoader.readConfig(envPath), forceWorkspace], overwrite)
      : cfg;
  }

  /**
   * @param {String} cfgPath
   * @returns {Object}
   */
  static readConfig(cfgPath) {
    const type = path.extname(cfgPath);

    switch (type) {
      case '.yml':
      case '.yaml':
        return yamlToJson(cfgPath);
      case '.json':
        return require(cfgPath);
      default:
        throw new Error(`${type} config is not supported!`);
    }
  }

  /**
   * Write only allowed config
   * @param {Object} json
   * @param {String} outFile
   * @returns {Object}
   */
  static writeConfig(json, outFile) {
    const format = config.format;

    switch (format) {
      case 'yml':
      case 'yaml':
        return jsonToYaml(json, outFile);
      case 'json':
        return fse.outputJsonSync(outFile, json, { spaces: 2 });
      default:
        throw new Error(`.${format} config is not supported!`);
    }
  }

  /**
   * Glob patterns to exclude matches
   * @returns {String[]}
   * @constructor
   */
  static get IGNORE_PATTERNS() {
    return ['**/node_modules/*'];
  }
}

module.exports = ConfigLoader;
