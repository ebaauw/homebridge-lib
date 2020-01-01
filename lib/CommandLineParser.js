// homebridge-lib/lib/CommandLineParser.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.
//
// Parser for command-line arguments.
//
// Todo:
// - Generate usage and help from flag(), option(), paramter(), remaining()

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')
const debug = require('debug')

const packageJson = require('../package.json')
let id = 0

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

class UsageError extends Error {}

/** Parser and validator for command-line arguments.
  */
// Todo:
// - Generate usage and help from flag(), option(), paramter(), remaining()
class CommandLineParser {
  constructor (pkgJson = packageJson) {
    this._debug = debug('CommandLineParser' + id++)
    this._debug('constructor()')
    this._callbacks = {
      flags: {},
      options: {},
      parameters: [],
      remaining: null
    }
    this._packageJson = pkgJson
  }

  _toShort (value, multiple = false) {
    if (value == null) {
      return null
    }
    if (typeof value !== 'string' || value.length !== 1) {
      throw new TypeError(`${value}: invalid short argument`)
    }
    if (this._callbacks.flags[value] != null && !multiple) {
      throw new SyntaxError(`${value}: duplicate key`)
    }
    return value
  }

  _toLong (value, multiple = false) {
    if (value == null) {
      return null
    }
    if (typeof value !== 'string' || value.length === 1) {
      throw new TypeError(`${value}: invalid long argument`)
    }
    if (this._callbacks.options[value] != null && !multiple) {
      throw new SyntaxError(`${value}: duplicate key`)
    }
    return value
  }

  // Setup a flag to print help and exit.
  help (short, long, helpText) {
    helpText = homebridgeLib.OptionParser.toString('helpText', helpText, true)
    this.flag(short, long, () => {
      console.log(helpText)
      console.log(`
See ${this._packageJson.homepage.split('#')[0]} for more info.
(${this._packageJson.name} v${this._packageJson.version}, node ${process.version})`
      )
      process.exit(0)
    })
  }

  // Setup a flag to print version and exit.
  version (short, long) {
    this.flag(short, long, () => {
      console.log(this._packageJson.version)
      process.exit(0)
    })
  }

  // Setup callback for a flag.
  flag (short, long, callback) {
    short = this._toShort(short)
    long = this._toLong(long)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._debug('flag(%j, %j)', short, long)
    if (short != null) {
      this._callbacks.flags[short] = callback
    }
    if (long != null) {
      this._callbacks.flags[long] = callback
    }
  }

  // Setup callback for an option to parse().
  option (short, long, callback) {
    short = this._toShort(short)
    long = this._toLong(long)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._debug('option(%j, %j)', short, long)
    if (short != null) {
      this._callbacks.options[short] = callback
    }
    if (long != null) {
      this._callbacks.options[long] = callback
    }
  }

  // Setup callback for a paramter.
  parameter (name, callback) {
    name = homebridgeLib.OptionParser.toString('name', name, true)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._debug('parameter(%j)', name)
    this._callbacks.parameters.push({ name: name, callback: callback })
  }

  // Setup callback for the remaining parameters.
  remaining (callback) {
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._debug('remaining()')
    this._callbacks.remaining = callback
  }

  // Parse command-line arguments.
  // process.argv[0]: node executable, process.argv[1]: javascript file
  parse (wordList = process.argv.slice(2)) {
    wordList = homebridgeLib.OptionParser.toArray('wordList', wordList)
    this._debug('parse(%j)', wordList)
    let wordIndex = 0
    let charIndex

    function handleWord (word, long) {
      const key = long ? word.split('=')[0] : word[0]
      const option = (long ? '--' : '-') + key
      let value = long ? word.split('=')[1] : null
      let callback = this._callbacks.flags[key]
      if (callback) {
        if (value != null) {
          throw new UsageError(`${option}: option doesn't allow an argument`)
        }
        this._debug('parse() => flag: %s', option)
        callback(option)
        return long
      }
      callback = this._callbacks.options[key]
      if (callback) {
        value = long ? word.split('=')[1] : word.substring(1)
        if (value) {
          charIndex = word.length
          this._debug(
            'parse() => option: %s%s%s', option, long ? '=' : '', value
          )
          callback(value, option)
          return true
        }
        if (wordIndex >= wordList.length) {
          throw new UsageError(`${option}: option requires an argument`)
        }
        value = wordList[wordIndex++]
        this._debug('parse() => option: %s %s', option, value)
        callback(value, option)
        return long
      }
      throw new UsageError(`${option}: unknown option`)
    }

    // Parse flags and options.
    while (wordIndex < wordList.length) {
      const word = wordList[wordIndex++]
      if (word[0] !== '-' || word === '-') {
        wordIndex -= 1
        break
      }
      if (word === '--') {
        break
      }
      if (word[1] === '-') {
        handleWord.call(this, word.substring(2), true)
        continue
      }
      charIndex = 1
      while (charIndex < word.length) {
        if (handleWord.call(this, word.substring(charIndex++), false)) {
          break
        }
      }
    }
    // Parse parameters.
    for (const p of this._callbacks.parameters) {
      if (wordIndex >= wordList.length) {
        throw new UsageError(`parameter ${p.name} missing`)
      }
      const parameter = wordList[wordIndex++]
      this._debug('parse() => parameter %s: %s', p.name, parameter)
      p.callback(parameter)
    }
    const remaining = wordList.slice(wordIndex, wordList.length)
    const callback = this._callbacks.remaining
    if (callback) {
      this._debug('parse() => remaining: %j', remaining)
      callback(remaining)
      return
    }
    if (remaining.length > 0) {
      throw new UsageError('too many parameters')
    }
  }
}

module.exports = CommandLineParser
