// homebridge-lib/lib/JsonFormatter.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

/** JSON formatter.
  */
class JsonFormatter {
  constructor (options = {}) {
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
    optionParser.parse(options)
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

  forEach (value, callback) {
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

  map (value, callback) {
    const array = []
    this.forEach(value, (keys, value) => {
      array.push(callback(keys, value))
    })
    return array
  }

  reduce (value, callback) {
    const aggregate = null
    this.forEach(value, (aggregate, keys, value) => {
      aggregate = callback(aggregate, keys, value)
    })
    return aggregate
  }

  format (value, maxDepth = this.options.maxDepth, withIndent = '  ') {
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

  stringify (value) {
    if (this.options.fromPath != null) {
      for (const key of this.options.fromPath) {
        if (typeof (value) === 'object' && value != null) {
          value = value[key]
        } else {
          value = undefined
        }
      }
    }
    if (!this.options.jsonArray) {
      return this.format(value)
    }
    const array = this.map(value, (keys, value) => {
      if (this.options.ascii) {
        if (this.options.keysOnly) { return `/${keys.join('/')}` }
        if (this.options.valuesOnly) { return this.format(value) }
        return `/${keys.join('/')}:${this.format(value)}`
      } else if (this.options.joinKeys) {
        if (this.options.keysOnly) { return `/${keys.join('/')}` }
        if (this.options.valuesOnly) { return value }
        const obj = {}
        obj[`/${keys.join('/')}`] = value
        return obj
      } else {
        if (this.options.keysOnly) { return { keys: keys } }
        if (this.options.valuesOnly) { return { value: value } }
        return { keys: keys, value: value }
      }
    })
    if (this.options.ascii) {
      return array.join('\n')
    }
    return this.format(array, 1)
  }
}

module.exports = JsonFormatter
