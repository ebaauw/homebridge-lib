#!/usr/bin/env node

// homebridge-lib/cli/json.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.
//
// JSON formatter.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')
const fs = require('fs')

const b = chalk.bold
const u = chalk.underline
const usage = `${b('json')} [${b('-hVsnjuatlkv')}] [${b('-p')} path] [${b('-d')} depth] [${b('-c')} ${u('string')}]... [${u('file')}]...`
const help = `JSON formatter.

Usage: ${usage}

By default, ${b('json')} reads JSON from stdin, formats it, and prints it to stdout.
The following parameters modify this behaviour:
  ${b('-h')}          Print this help and exit.
  ${b('-V')}          Print version and exit.
  ${b('-s')}          Sort object key/value pairs alphabetically on key.
  ${b('-n')}          Do not include spaces nor newlines in output.
  ${b('-j')}          Output JSON array of objects for each key/value pair.
              Each object contains two key/value pairs: key "keys" with an array
              of keys as value and key "value" with the value as value.
  ${b('-u')}          Output JSON array of objects for each key/value pair.
              Each object contains one key/value pair: the path (concatenated
              keys separated by '/') as key and the value as value.
  ${b('-a')}          Output path:value in plain text instead of JSON.
  ${b('-t')}          Limit output to top-level key/values.
  ${b('-p')} ${u('path')}     Limit output to key/values under ${u('path')}. Set top level below ${u('path')}.
  ${b('-d')} ${u('depth')}    Limit output to levels above ${u('depth')}.
  ${b('-l')}          Limit output to leaf (non-array, non-object) key/values.
  ${b('-k')}          Limit output to keys. With ${b('-u')} output JSON array of paths.
  ${b('-v')}          Limit output to values. With ${b('-u')} output JSON array of values.
  ${b('-c')} ${u('string')}   Read JSON from ${u('string')} instead of from stdin.
  ${u('file')}        Read JSON from ${u('file')} instead of from stdin.`

class Main extends homebridgeLib.CommandLineTool {
  constructor () {
    super()
    this.usage = usage
    this.options = {}
    this.stringList = []
    this.fileList = []
  }

  parseArguments () {
    const parser = new homebridgeLib.CommandLineParser()
    parser.help('h', 'help', help)
    parser.version('V', 'version')
    parser.flag('s', 'sortKeys', () => { this.options.sortKeys = true })
    parser.flag('n', 'noWhiteSpace', () => { this.options.noWhiteSpace = true })
    parser.flag('j', 'jsonArray', () => { this.options.jsonArray = true })
    parser.flag('u', 'joinKeys', () => { this.options.joinKeys = true })
    parser.flag('a', 'ascii', () => { this.options.ascii = true })
    parser.flag('t', 'topOnly', () => { this.options.topOnly = true })
    parser.option('d', 'maxDepth', (value, option) => {
      this.options.maxDepth = homebridgeLib.OptionParser.toInt(
        'maxDepth', value, 0, undefined, true)
    })
    parser.option('p', 'fromPath', (value, option) => {
      this.options.fromPath = homebridgeLib.OptionParser.toPath(
        'fromPath', value, true
      )
    })
    parser.flag('l', 'leavesOnly', () => { this.options.leavesOnly = true })
    parser.flag('k', 'keysOnly', () => { this.options.keysOnly = true })
    parser.flag('v', 'valuesOnly', () => { this.options.valuesOnly = true })
    parser.option('c', 'string', (value) => { this.stringList.push(value) })
    parser.remaining((list) => { this.fileList = list })
    parser.parse()
  }

  processString (s) {
    let value
    try {
      value = JSON.parse(s)
    } catch (error) {
      throw new Error(error.message) // Convert SyntaxError to Error.
    }
    const output = this.jsonFormatter.stringify(value)
    if (this.n++ > 0) {
      this.print('------')
    }
    if (output !== '') {
      this.print(output)
    }
  }

  main () {
    try {
      this.parseArguments()
      this.jsonFormatter = new homebridgeLib.JsonFormatter(this.options)
      if (this.fileList.length === 0 && this.stringList.length === 0) {
        this.fileList = ['-']
      }
      this.n = 0
      this.stringList.forEach((s) => {
        try {
          this.processString(s)
        } catch (error) {
          this.error(error)
        }
      })
      this.fileList.forEach((file) => {
        try {
          const s = fs.readFileSync(file === '-' ? 0 : file, 'utf8')
          this.processString(s)
        } catch (error) {
          this.error(error)
        }
      })
    } catch (error) {
      this.fatal(error)
    }
  }
}

new Main().main()
