// homebridge-lib/lib/CommandLineParser.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

// TODO:
// - Change parameters to (params, callback) with:
//   - params.shortKey
//   - params.longKey
//   - params.key
//   - params.optional
//   - params.minumum
//   - params.helpText

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')

const packageJson = require('../package.json')

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

/** Usage error.
  * @hideconstructor
  * @extends Error
  * @memberof CommandLineParser
  */
class UsageError extends Error {}

/** Parser and validator for command-line arguments.
  */
class CommandLineParser {
  static get UsageError () { return UsageError }

  /** Create a new parser instance.
    * @params {string} pkgJson - The contents of `package.json` to retrieve
    * the version and homepage for the command-line tool.
    */
  constructor (pkgJson = packageJson) {
    this._callbacks = {
      flags: {},
      options: {},
      parameters: [],
      remaining: null
    }
    this._packageJson = pkgJson
  }

  _toShort (value) {
    if (value == null) {
      return null
    }
    if (typeof value !== 'string' || value.length !== 1) {
      throw new TypeError(`${value}: invalid short key`)
    }
    if (this._callbacks.flags[value] != null) {
      throw new SyntaxError(`${value}: duplicate short key`)
    }
    return value
  }

  _toLong (value) {
    if (value == null) {
      return null
    }
    if (typeof value !== 'string' || value.length === 1) {
      throw new TypeError(`${value}: invalid long key`)
    }
    if (this._callbacks.options[value] != null) {
      throw new SyntaxError(`${value}: duplicate long key`)
    }
    return value
  }

  /** Add a flag to print help text and exit.
    *
    * See {@link CommandLineParser#flag flag()}.
    *
    * For now, the help text needs to be specified explicitly.
    * <br>TODO: Generate helpText automatically from
    * {@link CommandLineParser#flag flag()},
    * {@link CommandLineParser#option option()},
    * {@link CommandLineParser#parameter parameter()}, and
    * {@link CommandLineParser#remaining remaining()}
    * @param {string} shortKey - The short key (e.g. `h` for `-h`).
    * @param {string} longKey - The long key (e.g. `help` for `--help`).
    * @param {string} helpText - The help text.
    * @return {CommandLineParser} this - For chaining.
    */
  help (shortKey, longKey, helpText) {
    helpText = homebridgeLib.OptionParser.toString('helpText', helpText, true)
    this.flag(shortKey, longKey, () => {
      console.log(helpText)
      console.log(`
See ${this._packageJson.homepage.split('#')[0]} for more info.
(${this._packageJson.name} v${this._packageJson.version}, node ${process.version})`
      )
      process.exit(0)
    })
    return this
  }

  /** Add a flag to print the version and exit.
    *
    * See {@link CommandLineParser#flag flag()}.
    *
    * @param {string} shortKey - The short key (e.g. `V` for `-V`).
    * @param {string} longKey - The long key (e.g. `version` for `--version`).
    * @return {CommandLineParser} this - For chaining.
    */
  version (shortKey, longKey) {
    this.flag(shortKey, longKey, () => {
      console.log(this._packageJson.version)
      process.exit(0)
    })
    return this
  }

  /** Add a callback for a flag.
    *
    * A flag is an optional command-line parameter, identified by a short key
    * (a single character, like `-v`), or by a long key (a word, like
    * `--verbose`).
    *
    * @param {string} shortKey - The short key (e.g. `v` for `-v`).
    * @param {string} longKey - The long key (e.g. `verbose` for `--verbose`).
    * @param {function} callback - The callback function.<br>
    * The function will be called when the flag is present, with the
    * following parameters:
    *
    * Name | Type | Attributes | Description
    * ---- | ---- | ---------- | -----------
    * `key` | string | | The key.
    * @return {CommandLineParser} this - For chaining.
    */
  flag (shortKey, longKey, callback) {
    shortKey = this._toShort(shortKey)
    longKey = this._toLong(longKey)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    if (shortKey != null) {
      this._callbacks.flags[shortKey] = callback
    }
    if (longKey != null) {
      this._callbacks.flags[longKey] = callback
    }
    return this
  }

  /** Add a callback for an option.
    *
    * An option is an optional command-line paramater that takes a value.
    * The option is identified by a short key (a single character, like `-t`),
    * or by a long key (a word, like `--timeout`).
    * The value can specified in the next or in the same command-line parameter:
    * `-t5` `--timeout=5`, `-t 5`, or `--timeout 5`
    *
    * @param {string} shortKey - The short key (e.g. `t` for `-t`).
    * @param {string} longKey - The long key (e.g. `timeout` for `--timeout`).
    * @param {function} callback - The callback function.<br>
    * The function will be called when the option is present, with the
    * following parameters:
    *
    * Name | Type | Attributes | Description
    * ---- | ---- | ---------- | -----------
    * `value` | string | | The value.
    * `key` | string | | The (short or long) key.
    * @return {CommandLineParser} this - For chaining.
    */
  option (shortKey, longKey, callback) {
    shortKey = this._toShort(shortKey)
    longKey = this._toLong(longKey)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    if (shortKey != null) {
      this._callbacks.options[shortKey] = callback
    }
    if (longKey != null) {
      this._callbacks.options[longKey] = callback
    }
    return this
  }

  /** Add a callback for a positional parameter.
    *
    * A positional paramater is a mandatory command-line parameter.
    * It is specified as a single value, e.g. `get`
    *
    * @param {string} key - The parameter key (e.g. `command`).
    * @param {function} callback - The callback function.<br>
    * The function will be called with the following parameters:
    *
    * Name | Type | Attributes | Description
    * ---- | ---- | ---------- | -----------
    * `value` | string | | The parameter value.
    * `key` | string | | The parameter key.
    * @return {CommandLineParser} this - For chaining.
    */
  parameter (key, callback, optional = false) {
    key = homebridgeLib.OptionParser.toString('key', key, true)
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._callbacks.parameters.push({ key, callback, optional })
    return this
  }

  // * @param {string} key - The name of the remaining parameters (e.g.
  // * `file` for `[`_file_` ...]`).
  /** Add a callback for the remaining parameters.
    *
    * The remaining parameters are any additional commmand-line parameters,
    * after the positional paramers, typically indicated as `[file ...]`.
    * @param {function} callback - The callback function.<br>
    * This function will be called with the following paramters:
    *
    * Name | Type | Attributes | Description
    * ---- | ---- | ---------- | -----------
    * `values` | string[] | | A list of values of the remaining parameters.
    * @return {CommandLineParser} this - For chaining.
    */
  remaining (/* key, */ callback) {
    callback = homebridgeLib.OptionParser.toFunction('callback', callback)
    this._callbacks.remaining = callback
    return this
  }

  /** Parse the command-line parameters.
    *
    * @throws {UsageError} In case of invalid command-line paramters.
    */
  parse (wordList = process.argv.slice(2)) {
    // process.argv[0]: node executable, process.argv[1]: javascript file
    wordList = homebridgeLib.OptionParser.toArray('wordList', wordList)
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
        callback(option)
        return long
      }
      callback = this._callbacks.options[key]
      if (callback) {
        value = long ? word.split('=')[1] : word.substring(1)
        if (value) {
          charIndex = word.length
        } else {
          if (wordIndex >= wordList.length) {
            throw new UsageError(`${option}: option requires an argument`)
          }
          value = wordList[wordIndex++]
        }
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
        if (!p.optional) {
          throw new UsageError(`parameter ${p.key} missing`)
        }
        break
      }
      const parameter = wordList[wordIndex++]
      p.callback(parameter)
    }
    const remaining = wordList.slice(wordIndex, wordList.length)
    const callback = this._callbacks.remaining
    if (callback) {
      callback(remaining)
      return
    }
    if (remaining.length > 0) {
      throw new UsageError('too many parameters')
    }
  }
}

module.exports = CommandLineParser
