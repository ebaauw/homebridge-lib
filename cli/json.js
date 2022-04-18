#!/usr/bin/env node

// homebridge-lib/cli/json.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2022 Erik Baauw. All rights reserved.
//
// JSON formatter.

'use strict'

const homebridgeLib = require('../index')

const fs = require('fs')
const util = require('util')
const zlib = require('zlib')

const gunzip = util.promisify(zlib.unzip)

const { b, u } = homebridgeLib.CommandLineTool

const usage = `${b('json')} [${b('-hVsnjuatlkv')}] [${b('-p')} path] [${b('-d')} depth] [${b('-c')} ${u('string')}]... [${u('file')}]...`
const help = `JSON formatter.

Usage: ${usage}

By default, ${b('json')} reads JSON from stdin, formats it, and prints it to stdout.

Parameters:
  ${b('-h')}, ${b('--help')}
  Print this help and exit.

  ${b('-V')}, ${b('--version')}
  Print version and exit.

  ${b('-s')}, ${b('--sortKeys')}
  Sort object key/value pairs alphabetically on key.

  ${b('-n')}, ${b('--noWhiteSpace')}
  Do not include spaces nor newlines in output.

  ${b('-j')}, ${b('--jsonArray')}
  Output JSON array of objects for each key/value pair.
  Each object contains two key/value pairs:
  - key ${b('keys')} with an array of keys as value;
  - key ${b('value')} with the value as value.

  ${b('-u')}, ${b('--joinKeys')}
  Output JSON array of objects for each key/value pair.
  Each object contains one key/value pair:
  the path (concatenated keys separated by ${b('/')} as key and the value as value.

  ${b('-a')}, ${b('--ascii')}
  Output ${u('path')}${b(':')}${u('value')} in plain text instead of JSON.

  ${b('-t')}, ${b('--topOnly')}
  Limit output to top-level key/values.

  ${b('-p')} ${u('path')}, ${b('--fromPath=')}${u('path')}
  Limit output to key/values under ${u('path')}. Set top level below ${u('path')}.

  ${b('-d')} ${u('depth')}, ${b('--maxDepth=')}${u('depth')}
  Limit output to levels above ${u('depth')}.

  ${b('-l')}, ${b('--leavesOnly')}
  Limit output to leaf (non-array, non-object) key/values.

  ${b('-k')}, ${b('--keysOnly')}
  Limit output to keys. With ${b('-u')} output JSON array of paths.

  ${b('-v')}, ${b('--valuesOnly')}
  Limit output to values. With ${b('-u')} output JSON array of values.

  ${b('-c')} ${u('string')}, ${b('--string=')}${u('string')}
  Read JSON from ${u('string')} instead of from stdin.

  ${u('file')}
  Read JSON from ${u('file')} instead of from stdin.
  When the file name ends in ${b('.gz')}, it is assumed to be a gzip file and
  uncompressed automatically.`

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
    parser
      .help('h', 'help', help)
      .version('V', 'version')
      .flag('s', 'sortKeys', () => { this.options.sortKeys = true })
      .flag('n', 'noWhiteSpace', () => { this.options.noWhiteSpace = true })
      .flag('j', 'jsonArray', () => { this.options.jsonArray = true })
      .flag('u', 'joinKeys', () => { this.options.joinKeys = true })
      .flag('a', 'ascii', () => { this.options.ascii = true })
      .flag('t', 'topOnly', () => { this.options.topOnly = true })
      .option('d', 'maxDepth', (value, option) => {
        this.options.maxDepth = homebridgeLib.OptionParser.toInt(
          'maxDepth', value, 0, undefined, true)
      })
      .option('p', 'fromPath', (value, option) => {
        this.options.fromPath = homebridgeLib.OptionParser.toPath(
          'fromPath', value, true
        )
      })
      .flag('l', 'leavesOnly', () => { this.options.leavesOnly = true })
      .flag('k', 'keysOnly', () => { this.options.keysOnly = true })
      .flag('v', 'valuesOnly', () => { this.options.valuesOnly = true })
      .option('c', 'string', (value) => { this.stringList.push(value) })
      .remaining((list) => { this.fileList = list })
      .parse()
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

  async main () {
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
      this.fileList.forEach(async (file) => {
        try {
          const s = file.endsWith('.gz')
            ? await gunzip(fs.readFileSync(file))
            : fs.readFileSync(file === '-' ? 0 : file, 'utf8')
          this.processString(s)
        } catch (error) {
          this.error(error)
        }
      })
    } catch (error) {
      await this.fatal(error)
    }
  }
}

new Main().main()
