// homebridge-lib/lib/CommandLineUtility.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')
const util = require('util')

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

// Check of e is a JavaScript runtime error.
function isJavaScriptError (e) {
  return [
    'AssertionError',
    'EvalError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError'
  ].includes(e.constructor.name)
}

// Check if e is a NodeJs runtime error.
function isNodejsError (e) {
  return typeof e.code === 'string' && e.code.startsWith('ERR_')
}

/** Abstract superclass for a command-line tool.
  */
class CommandLineTool {
  /** Convert Error to string.
    *
    * Include the stack trace only for programming errors (JavaScript and NodeJS
    * runtime errors).
    * Translate system errors into more readable messages.
    * @param {Error} e - The error.
    * @param {boolean} [useChalk=false] - Use chalk to grey out the stack trace.
    * @returns {string} - The error as string.
    */
  static formatError (e, useChalk = false) {
    if (isJavaScriptError(e) || isNodejsError(e)) {
      if (useChalk) {
        const lines = e.stack.split('\n')
        const firstLine = lines.shift()
        return firstLine + '\n' + chalk.reset.grey(lines.join('\n'))
      }
      return e.stack
    } else if (e.errno != null) { // SystemError
      let label = ''
      if (e.path != null) {
        label = e.path
      } else if (e.dest != null) {
        label = e.dest
      } else if (e.address != null) {
        label = e.address + (e.port == null ? '' : ':' + e.port)
      } else if (e.port != null) {
        label = '' + e.port
      } else if (e.hostname != null) {
        label = e.hostname
      }
      let message = ''
      const a = /[A-Z0-9_-]*:( .*),/.exec(e.message)
      if (a != null && a[1] != null) {
        message = a[1]
      }
      return `${label}: cannot ${e.syscall}: ${e.code}${message}`
    } else if (e.cmd != null && e.message.slice(-1) === '\n') {
      return e.message.slice(0, e.message.length - 1)
    } else {
      return e.message
    }
  }

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
    } catch (error) {
      this.fatal(error)
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
  _log (level, ...args) {
    let output = process.stderr
    const program = this._options.program ? this._name + ': ' : ''
    let timestamp = this._options.timestamp
      ? '[' + String(new Date()).substring(0, 24) + '] ' : ''
    timestamp = this._options.chalk ? chalk.white(timestamp) : timestamp
    let message

    // If last argument is Error convert it to string.
    if (args.length > 0) {
      let lastArg = args.pop()
      if (lastArg instanceof Error) {
        lastArg = CommandLineTool.formatError(lastArg, this._options.chalk)
      }
      args.push(lastArg)
    }

    // Format message.
    if (args[0] == null) {
      message = ''
    } else if (typeof (args[0]) === 'string') {
      message = util.format(...args)
    } else {
      throw new TypeError('format: not a string or Error object')
    }

    // Handle newline.
    if (message.substring(message.length - 2) === '\\c') {
      message = message.substring(0, message.length - 2)
    } else {
      message = message + '\n'
    }

    // Output message.
    switch (level) {
      case 'debug':
        message = program + message
        message = this._options.chalk ? chalk.grey(message) : message
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
