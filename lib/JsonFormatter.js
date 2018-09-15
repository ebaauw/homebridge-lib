// homebridge-lib/lib/JsonFormatter.js
//
// Library for homebridge plug-ins.
// Copyright © 2018 Erik Baauw. All rights reserved.
//
// JSON formatter.

'use strict'

const homebridgeLib = {
  OptionParser: require('./OptionParser')
}

module.exports = class JsonFormatter {
  constructor (options = {}) {
    const optionParser = new homebridgeLib.OptionParser(this)
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
    if (this.ascii) {
      this.noWhiteSpace = true
      this.joinKeys = true
    }
    if (
      this.joinKeys || this.topOnly || this.leavesOnly ||
      this.keysOnly || this.valuesOnly
    ) {
      this.jsonArray = true
    }
  }

  forEach (value, callback) {
    function forEach (keys, value, depth) {
      // jshint -W040
      const isCollection = (typeof (value) === 'object' && value != null)

      if (value === undefined) {
        return
      }
      if (
        !isCollection ||
        (!this.leavesOnly && (!this.topOnly || depth === 1))
      ) {
        callback(keys, value)
      }
      if (
        isCollection && (!this.topOnly || depth === 0) &&
        depth !== this.maxDepth
      ) {
        const list = Object.keys(value)
        if (this.sortKeys && !Array.isArray(value)) {
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
    let aggregate = null
    this.forEach(value, (aggregate, keys, value) => {
      aggregate = callback(aggregate, keys, value)
    })
    return aggregate
  }

  format (value, maxDepth = this.maxDepth, withIndent = '  ') {
    function format (value, depth, indent) {
      // jshint -W040
      const noNewline = this.noWhiteSpace || depth >= maxDepth
      const nl = this.noWhiteSpace ? '' : noNewline ? ' ' : '\n'
      const sp = this.noWhiteSpace ? '' : ' '
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
      if (this.sortKeys && !Array.isArray(value)) {
        list.sort()
      }
      for (const key of list) {
        const k = Array.isArray(value) ? '' : `"${key}":${sp}`
        const v = format.call(this, value[key], depth + 1, `${wi}${id}`)
        array.push(k + v)
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
    if (this.fromPath != null) {
      for (const key of this.fromPath) {
        if (typeof (value) === 'object' && value != null) {
          value = value[key]
        } else {
          value = undefined
        }
      }
    }
    if (!this.jsonArray) {
      return this.format(value)
    }
    let array = this.map(value, (keys, value) => {
      if (this.ascii) {
        if (this.keysOnly) { return `/${keys.join('/')}` }
        if (this.valuesOnly) { return this.format(value) }
        return `/${keys.join('/')}:${this.format(value)}`
      } else if (this.joinKeys) {
        if (this.keysOnly) { return `/${keys.join('/')}` }
        if (this.valuesOnly) { return value }
        const obj = {}
        obj[`/${keys.join('/')}`] = value
        return obj
      } else {
        if (this.keysOnly) { return { keys: keys } }
        if (this.valuesOnly) { return { value: value } }
        return { keys: keys, value: value }
      }
    })
    if (this.ascii) {
      return array.join('\n')
    }
    return this.format(array, 1)
  }
}
