// homebridge-lib/lib/JsonFormatter.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

/** JSON formatter.
  *
  * Class to format (pretty-print) JavaScript types to formatted JSON strings.
  * This class is the engine under the `json` command-line tool.
  */
class JsonFormatter {
  /** Create a new instance of a JSON formatter.
    *
    * The parameters configure how the JSON should be formatted.
    * @param {object} params - Parameters.
    * @param {boolean} [params.ascii=false] - Output path:value in plain text
    * instead of JSON.
    * <br>Command-line equivalent: `json -a`
    * @param {string} params.fromPath - Limit output to key/values under path.
    * <br>Set top level below path.
    * <br>Command-line equivalent: `json -p `_path_
    * @param {boolean} [params.jsonArray=false] - Output JSON array of objects
    * for each key/value pair.<br>
    * Each object contains two key/value pairs: key `keys` with an array
    * of keys as value and key `value` with the value as value.
    * <br>Command-line equivalent: `json -j`
    * @param {boolean} [params.joinKeys=false] - Output JSON array of objects
    * for each key/value pair.<br>
    * Each object contains one key/value pair: the path (concatenated
    * keys separated by '/') as key and the value as value.
    * <br>Command-line equivalent: `json -u`
    * @param {boolean} [params.keysOnly=false] -  Limit output to keys.
    * <br>With `joinKeys` output JSON array of paths.
    * <br>Command-line equivalent: `json -k`
    * @param {boolean} [params.leavesOnly=false] -  Limit output to leaf
    * (non-array, non-object) key/values.
    * <br>Command-line equivalent: `json -l`
    * @param {?integer} params.maxDepth - Limit output to levels above depth.
    * <br>Command-line equivalent: `json -d `_depth_
    * @param {boolean} [params.noWhiteSpace=false] - Do not include spaces nor
    * newlines in the output.
    * <br>Command-line equivalent: `json -n`
    * @param {boolean} [params.sortKeys=false] - Sort object key/value pairs
    * alphabetically on key.
    * <br>Command-line equivalent: `json -s`
    * @param {boolean} [params.topOnly=false] - Limit output to top-level key/values.
    * <br>Command-line equivalent: `json -t`
    * @param {boolean} [params.valuesOnly=false] -  Limit output to values.
    * <br>With `joinKeys` output JSON array of values.
    * <br>Command-line equivalent: `json -v`
    */
  constructor (params = {}) {
    this.options = {}
    const optionParser = new homebridgeLib.OptionParser(this.options)
    optionParser.boolKey('sortKeys')
    optionParser.boolKey('noWhiteSpace')
    optionParser.boolKey('jsonArray')
    optionParser.boolKey('joinKeys')
    optionParser.boolKey('ascii')
    optionParser.boolKey('topOnly')
    optionParser.intKey('maxDepth', 0)
    optionParser.pathKey('fromPath')
    optionParser.boolKey('leavesOnly')
    optionParser.boolKey('keysOnly')
    optionParser.boolKey('valuesOnly')
    optionParser.parse(params)
    if (this.options.ascii) {
      this.options.noWhiteSpace = true
      this.options.joinKeys = true
    }
    if (
      this.options.joinKeys || this.options.topOnly || this.options.leavesOnly ||
      this.options.keysOnly || this.options.valuesOnly
    ) {
      this.options.jsonArray = true
    }
  }

  _forEach (value, callback) {
    function forEach (keys, value, depth) {
      const isCollection = (typeof (value) === 'object' && value != null)

      if (value === undefined) {
        return
      }
      if (
        !isCollection ||
        (!this.options.leavesOnly && (!this.options.topOnly || depth === 1))
      ) {
        callback(keys, value)
      }
      if (
        isCollection && (!this.options.topOnly || depth === 0) &&
        depth !== this.options.maxDepth
      ) {
        const list = Object.keys(value)
        if (this.options.sortKeys && !Array.isArray(value)) {
          list.sort()
        }
        for (const key of list) {
          forEach.call(this, keys.concat([key]), value[key], depth + 1)
        }
      }
    }

    forEach.call(this, [], value, 0)
  }

  _map (value, callback) {
    const array = []
    this._forEach(value, (keys, value) => {
      array.push(callback(keys, value))
    })
    return array
  }

  _format (value, maxDepth = this.options.maxDepth, withIndent = '  ') {
    function format (value, depth, indent) {
      const noNewline = this.options.noWhiteSpace || depth >= maxDepth
      const nl = this.options.noWhiteSpace ? '' : noNewline ? ' ' : '\n'
      const sp = this.options.noWhiteSpace ? '' : ' '
      const nlsp = noNewline ? '' : '\n'
      const wi = noNewline ? '' : withIndent
      const id = noNewline ? '' : indent

      if (value === undefined) {
        return ''
      }
      if (typeof (value) !== 'object' || value == null) {
        return JSON.stringify(value)
      }
      const array = []
      const list = Object.keys(value)
      if (this.options.sortKeys && !Array.isArray(value)) {
        list.sort()
      }
      for (const key of list) {
        if (value[key] !== undefined) {
          const k = Array.isArray(value) ? '' : `"${key}":${sp}`
          const v = format.call(this, value[key], depth + 1, `${wi}${id}`)
          array.push(k + v)
        }
      }
      let s = array.join(`,${nl}${wi}${id}`)
      if (s !== '') {
        s = `${nlsp}${wi}${id}${s}${nlsp}${id}`
      }
      return Array.isArray(value) ? `[${s}]` : `{${s}}`
    }
    return format.call(this, value, 0, '')
  }

  /** Transform javascript value into a formatted JSON string.
    *
    * @param {*} value - The JavaScript value.
    * @return {string} json - The formatted JSON string.
    */
  stringify (value) {
    if (this.options.fromPath != null) {
      const a = this.options.fromPath.slice(1).split('/')
      for (const key of a) {
        if (typeof (value) === 'object' && value != null) {
          value = value[key]
        } else {
          value = undefined
        }
      }
    }
    if (!this.options.jsonArray) {
      return this._format(value)
    }
    const array = this._map(value, (keys, value) => {
      if (this.options.ascii) {
        if (this.options.keysOnly) { return `/${keys.join('/')}` }
        if (this.options.valuesOnly) { return this._format(value) }
        return `/${keys.join('/')}:${this._format(value)}`
      } else if (this.options.joinKeys) {
        if (this.options.keysOnly) { return `/${keys.join('/')}` }
        if (this.options.valuesOnly) { return value }
        const obj = {}
        obj[`/${keys.join('/')}`] = value
        return obj
      } else {
        if (this.options.keysOnly) { return { keys } }
        if (this.options.valuesOnly) { return { value } }
        return { keys, value }
      }
    })
    if (this.options.ascii) {
      return array.join('\n')
    }
    return this._format(array, 1)
  }
}

module.exports = JsonFormatter
