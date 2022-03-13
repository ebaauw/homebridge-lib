// homebridge-lib/lib/CommandLineUtility.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')
const util = require('util')

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

/** Command-line tool.
  */
class CommandLineTool {
  /** Make text bold.
    * @param {string} text - The text.
    * @returns {string} - The bold text.
    */
  static b (text) { return chalk.bold(text) }

  /** Make text underlined.
    * @param {string} text - The text.
    * @returns {string} - The underlined text.
    */
  static u (text) { return chalk.underline(text) }

  /** Create a new instance of a command line utility.
    */
  constructor (options = { mode: 'command' }) {
    // We need to handle errors here, for subtype or caller won't be able
    // to log the error/exception without our log functions.
    try {
      // Set program name
      // argv[0]: node executable, argv[1]: javascript file
      this.name = process.argv[1]
      // Use {mode: "command"} as default for logging.
      this._options = {
        chalk: false,
        debug: false,
        program: true,
        timestamp: false
      }
      // Set logging options.
      this.setOptions(options)

      process
        .on('SIGHUB', this._onSignal.bind(this))
        .on('SIGINT', this._onSignal.bind(this))
        .on('SIGTERM', this._onSignal.bind(this))
        .on('SIGABRT', this._onSignal.bind(this))
        .on('uncaughtException', async (error) => {
          await this.fatal('uncaught exception: %s', error.stack)
        })
        .removeAllListeners('unhandledRejection')
        .on('unhandledRejection', async (error) => {
          await this.fatal('unhandled rejection: %s', error.stack)
        })
    } catch (error) {
      this._log({ label: 'fatal', chalk: chalk.bold.red }, error)
    }
  }

  /** Set logging options.
    * @param {object} options - Loggin options.
    * @parameter {string} mode - Mode in which utlity is run:<br>
    * - `command` - From the command line.
    * - `daemon` - As a daemon.
    * - `service` - As a service.
    * @parameter {boolean} [debug=false] - Output debug messages.
    * @parameter {boolean} [vdebug=false] - Output verbose debug messages.
    * @parameter {boolean} [vvdebug=false] - Output very verbose debug messages.
    * @returns {object} - The old options.
    */
  setOptions (options) {
    if (this.optionParser == null) {
      this.optionParser = new homebridgeLib.OptionParser(this._options)
      this.optionParser
        .boolKey('chalk') // Use chalk to colour messages.
        .boolKey('debug') // Show debug messages.
        .boolKey('vdebug') // Show verbose debug messages.
        .boolKey('vvdebug') // Show very verbose debug messages.
        .boolKey('program') // Include program name.
        .boolKey('timestamp') // Include timestamp.
        .enumKey('mode')
        .enumKeyValue('mode', 'command', () => {
          // Command-line program.
          this._options.chalk = false
          this._options.program = true
          this._options.timestamp = false
        })
        .enumKeyValue('mode', 'daemon', () => {
          // Program runs as standalone daemon.
          this._options.chalk = true
          this._options.program = false
          this._options.timestamp = true
        })
        .enumKeyValue('mode', 'service', () => {
          // Program runs as systemctl service.
          this._options.chalk = true
          this._options.program = false
          this._options.timestamp = false
        })
    }
    const oldOptions = this._options
    this.optionParser.parse(options)
    if (this._options.debug) {
      this._options.chalk = true
    }

    return oldOptions
  }

  /** Do cleanup before exit.
    * @abstract
    */
  async destroy () {}

  // Signal handler.
  async _onSignal (signal, signalNum) {
    this.log('got %s - exiting', signal)
    try {
      await this.destroy()
    } catch (error) {
      this.error(error)
    }
    setImmediate(() => { process.exit(128 + signalNum) })
    // Prevent _onSignal() from returning.
    await homebridgeLib.timeout(1000)
  }

  /** Program name.
    * @type {string}
    */
  get name () { return this._name }
  set name (name) {
    const list = name.split('/')
    this._name = list[list.length - 1]
    process.title = this._name
  }

  /** Debug mode is enabled.
    * @type {boolean}
    */
  get debugEnabled () {
    return !!this._options.debug
  }

  /** Usage string.
    * @type {string}
    */
  get usage () { return this._usage }
  set usage (usage) {
    this._usage = usage
  }

  /** Verbose debug mode is enabled.
    * @type {boolean}
    */
  get vdebugEnabled () {
    return !!this._options.vdebug
  }

  // ===== Logging =============================================================

  /** Print debug message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  debug (format, ...args) {
    if (this._options.debug) {
      this._log({ chalk: chalk.grey }, format, ...args)
    }
  }

  /** Print error message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  error (format, ...args) {
    this._log({ label: 'error', chalk: chalk.bold.red }, format, ...args)
  }

  /** Print error message to stderr and abort program.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  async fatal (format, ...args) {
    this._log({ label: 'fatal', chalk: chalk.bold.red }, format, ...args)
    try {
      await this.destroy()
    } catch (error) {
      this.error(error)
    }
    setImmediate(() => { process.exit(-1) })
    // Prevent fatal() from returning.
    await homebridgeLib.timeout(1000)
  }

  /** Print log message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  log (format, ...args) {
    this._log({}, format, ...args)
  }

  /** Print log message continuation to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  logc (format, ...args) {
    this._log({ noLabel: true }, format, ...args)
  }

  /** Print message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  print (format, ...args) {
    this._log({ noLabel: true, stdout: true }, format, ...args)
  }

  /** Print verbose debug message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vdebug (format, ...args) {
    if (this._options.vdebug) {
      this._log({ chalk: chalk.grey }, format, ...args)
    }
  }

  /** Print very verbose debug message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vvdebug (format, ...args) {
    if (this._options.vvdebug) {
      this._log({ chalk: chalk.grey }, format, ...args)
    }
  }

  /** Print warning message to stderr.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  warn (format, ...args) {
    this._log({ label: 'warning', chalk: chalk.yellow }, format, ...args)
  }

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account the options, and errors vs exceptions.
  _log (params = {}, ...args) {
    const output = params.stdout ? process.stdout : process.stderr
    let timestamp = ''
    let message = ''
    let usage

    // If last argument is Error convert it to string.
    if (args.length > 0) {
      let lastArg = args.pop()
      if (lastArg instanceof Error) {
        if (lastArg.constructor.name === 'UsageError') {
          usage = true
        }
        lastArg = homebridgeLib.formatError(lastArg, this._options.chalk)
      }
      args.push(lastArg)
    }

    // Format message.
    if (args[0] == null) {
      message = ''
    } else if (typeof args[0] === 'string') {
      message = util.format(...args)
    } else {
      message = util.format('%o', ...args)
    }

    // Handle newline.
    if (message.substring(message.length - 2) === '\\c') {
      message = message.substring(0, message.length - 2)
    } else {
      message += '\n'
    }

    // Handle labels.
    if (!params.noLabel) {
      if (params.label != null) {
        message = params.label + ': ' + message
      }
      if (this._options.program) {
        message = this._name + ': ' + message
      }
      if (this._options.timestamp) {
        timestamp = '[' + String(new Date()).substring(0, 24) + '] '
        if (this._options.chalk) {
          timestamp = chalk.white(timestamp)
        }
      }
    }

    // Handle colours.
    if (params.chalk != null && this._options.chalk) {
      message = params.chalk(message)
    }
    output.write(timestamp + message)
    if (usage && this._usage != null) {
      this.logc('usage: %s', this._usage)
    }
  }
}

module.exports = CommandLineTool
