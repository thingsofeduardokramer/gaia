'use strict';

var childProcess = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    os = require('os'),
    ejs = require('ejs'),
    emptyPort = require('empty-port');

var CAL_ICS_TMP_PATH = __dirname + '/template/calendar.ics.ejs',
    CONFIG_TMP_PATH = __dirname + '/template/config.ejs',
    START_PORT = 50000;

/**
 * Radicale inherit CaldavServer.
 * It is a kind of CaldavServer implemented by pure Python.
 *
 * We install it from the gaia-marionette shell script file
 * during running the tests.
 */
function Radicale() {
  // The instance of the child process.
  this.childProcess = null;
  // The events stored in the server.
  this.events = [];
  // Set up dav directories.
  this.configFilePath = path.join(os.tmpdir(), 'config');
  this.fileSystemPath = path.join(os.tmpdir(), 'collections');
}

Radicale.prototype = {
  /**
   * Server port.
   * @type {Number}
   */
  port: null,

  /**
   * The path to the config file.
   * @type {String}
   */
  configFilePath: null,

  /**
   * The path to the directory of the file system in server.
   * @type {String}
   */
  fileSystemPath: null,

  /**
   * Setup the config file for the Radicale server.
   */
  _setup: function() {
    // Setup the Radicale config file,
    // and we create it at path /radicale/install/path/config in the disk.
    var configTemplate,
        config;

    if (!fs.existsSync(this.fileSystemPath)) {
      fs.mkdirSync(this.fileSystemPath);
    }

    configTemplate = fs.readFileSync(CONFIG_TMP_PATH, 'utf8'),
    config = ejs.render(configTemplate, {
      port: this.port,
      filesystemPath: this.fileSystemPath
    });

    fs.writeFileSync(this.configFilePath, config);
  },

  /**
   * Start the Radicale server with config file.
   *
   * @param {Object} options for the server.
   * @param {Function} callback with port param execute
   * after server is started.
   */
  start: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if ('port' in options) {
      this.port = options.port;
      this._executeServer();
      return callback && callback(null, options.port);
    }

    emptyPort({ startPort: START_PORT }, function(error, port) {
      if (error) {
        return callback && callback(error);
      }

      this.port = port;
      this._executeServer();
      return callback && callback(null, port);
    }.bind(this));
  },

  /**
   * Execute the server with terminal command.
   */
  _executeServer: function() {
    this._setup();
    this.childProcess =
      childProcess.spawn('radicale', ['--config', this.configFilePath]);
  },

  /**
   * Shutdown the Radicale server.
   *
   * @param {Function} callback execute after server is closed.
   */
  close: function(callback) {
    this.childProcess.on('exit', function() {
      if (callback && typeof(callback) === 'function') {
        callback();
      }
    });
    this.childProcess.kill();
  },

  /**
   * Add events in the CalDAV server.
   *
   * @param {String} username The user you would like to add for.
   * @param {Array|Object} event JSON objects, the structure is like
   *   { startDate, endDate, title, location, description }.
   */
  addEvent: function(username, event) {
    if (Array.isArray(event)) {
      this.events = this.events.concat(event);
    } else {
      this.events.push(event);
    }

    var calendarIcsTemplate = fs.readFileSync(CAL_ICS_TMP_PATH, 'utf8'),
        calendarIcs = ejs.render(calendarIcsTemplate, { events: this.events });

    fs.writeFileSync(
      path.join(this.fileSystemPath, username),
      calendarIcs
    );
  },

  /**
   * Remove all events for all users.
   */
  removeAllEvents: function() {
    this.events = [];
    fs.readdirSync(this.fileSystemPath).forEach(function(file) {
      fs.unlinkSync(path.join(this.fileSystemPath, file));
    }.bind(this));
  }
};

module.exports = Radicale;
