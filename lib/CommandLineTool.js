// homebridge-lib/lib/CommandLineUtility.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')
const util = require('util')

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

/** Abstract superclass for a command-line tool.
  */
class CommandLineTool {
  /** Create a new instance of a command line utility.
    */
  constructor (options = { mode: 'command' }) {
    // We need to handle errors here, for supertype or caller won't be able
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
    } catch (err) {
      this.fatal(err)
    }
  }

  /** Set logging options.
    * @param {object} options - Loggin options.
    * @parameter {string} mode - Modus in which utlity is run:<br>
    * - `command` - From the command line.
    * - `daemon` - As a daemon.
    * - `service` - As a service.
    * @parameter {boolean} [debug=false] - Output debug messages.
    * @returns {object} - The old options.
    */
  setOptions (options) {
    if (this.optionParser == null) {
      this.optionParser = new homebridgeLib.OptionParser(this._options)
      this.optionParser.boolKey('chalk') // Use chalk to colour messages.
      this.optionParser.boolKey('debug') // Show debug messages.
      this.optionParser.boolKey('program') // Include program name.
      this.optionParser.boolKey('timestamp') // Include timestamp.
      this.optionParser.enumKey('mode')
      this.optionParser.enumKeyValue('mode', 'command', (value) => {
        // Command-line program.
        this._options.chalk = false
        this._options.program = true
        this._options.timestamp = false
      })
      this.optionParser.enumKeyValue('mode', 'daemon', (value) => {
        // Program runs as standalone daemon.
        this._options.chalk = true
        this._options.program = false
        this._options.timestamp = true
      })
      this.optionParser.enumKeyValue('mode', 'service', (value) => {
        // Program runs as systemctl service.
        this._options.chalk = true
        this._options.program = false
        this._options.timestamp = false
      })
    }
    const oldOptions = this._options
    this.optionParser.parse(options)

    return oldOptions
  }

  get name () {
    return this._name
  }
  set name (name) {
    const list = name.split('/')
    this._name = list[list.length - 1]
    process.title = this._name
  }

  get usage () {
    return this._usage
  }
  set usage (usage) {
    this._usage = usage
  }

  // ===== Logging =============================================================

  // Print debug message to stderr.
  debug (format, ...args) {
    if (this._options.debug) {
      this._log('debug', format, ...args)
    }
  }

  // Print error message to stderr.
  error (format, ...args) {
    this._log('error', format, ...args)
  }

  // Print error message to stderr and exit.
  fatal (format, ...args) {
    this._log('fatal', format, ...args)
    process.exit(1)
  }

  // Print log message to stderr.
  log (format, ...args) {
    this._log('log', format, ...args)
  }

  // Print log message continuation to stderr.
  logc (format, ...args) {
    this._log('logc', format, ...args)
  }

  // Print message to stdout.
  print (format, ...args) {
    this._log('print', format, ...args)
  }

  // Print warning message to stderr.
  warn (format, ...args) {
    this._log('warning', format, ...args)
  }

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account the options, and errors vs exceptions.
  _log (level, format, ...args) {
    let output = process.stderr
    const program = this._options.program ? this._name + ': ' : ''
    let timestamp = this._options.timestamp
      ? '[' + String(new Date()).substring(0, 24) + '] ' : ''
    timestamp = this._options.chalk ? chalk.white(timestamp) : timestamp
    let message

    if (format == null) {
      message = ''
    } else if (format instanceof Error) {
      switch (format.constructor.name) {
        case 'AssertionError':
        case 'RangeError':
        case 'ReferenceError':
        case 'SyntaxError':
        case 'TypeError':
          // Error: print stack trace.
          message = format.stack
          break
        case 'UsageError':
          // Exception: print message.
          message = format.message
          if (this._usage) {
            message += `\n\nUsage: ${this._usage}`
          }
          break
        default:
          // Exception: print message.
          message = format.message
          break
      }
    } else if (typeof (format) === 'string') {
      message = util.format(format, ...args)
    } else if (typeof (format.toString) === 'function') {
      // Not a string, but convertable into a string.
      message = util.format(format.toString(), ...args)
    } else {
      throw new TypeError('format: not a string or Error object')
    }

    if (message.substring(message.length - 2) === '\\c') {
      message = message.substring(0, message.length - 2)
    } else {
      message = message + '\n'
    }

    switch (level) {
      case 'debug':
        message = program + message
        message = chalk.grey(message)
        message = timestamp + message
        break
      case 'log':
        message = program + message
        message = timestamp + message
        break
      case 'logc':
        break
      case 'print':
        output = process.stdout
        break
      case 'warning':
        message = program + 'warning: ' + message
        message = this._options.chalk ? chalk.yellow(message) : message
        message = timestamp + message
        break
      default:
        message = program + level + ': ' + message
        message = this._options.chalk ? chalk.bold.red(message) : message
        message = timestamp + message
        break
    }

    output.write(message)
  }
}

module.exports = CommandLineTool
