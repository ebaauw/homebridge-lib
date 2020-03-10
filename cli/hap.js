#!/usr/bin/env node

// homebridge-lib/cli/hap.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.
//
// Logger for HomeKit accessory announcements.

'use strict'

const homebridgeLib = require('../index')

const Bonjour = require('bonjour-hap')
const chalk = require('chalk')

const b = chalk.bold
const u = chalk.underline
const usage = `${b('hap')} [${b('-hVlrs')}] [${b('-t')} ${u('timeout')}]`
const help = `Logger for HomeKit accessory announcements.

Usage: ${usage}

Search for HomeKit accessory announcements
Parameters:
  ${b('-h')}          Print this help and exit.
  ${b('-V')}          Print version and exit.
  ${b('-l')}          Listen for Bonjour alive broadcasts instead of searching.
  ${b('-s')}          Do not output timestamps (useful when running as service).
  ${b('-t')} ${u('timeout')}  Search for ${u('timeout')} seconds instead of default ${b('5')}.`

class Main extends homebridgeLib.CommandLineTool {
  constructor () {
    super()
    this.usage = usage
    this.options = { timeout: 15 }
  }

  parseArguments () {
    const parser = new homebridgeLib.CommandLineParser()
    parser.help('h', 'help', help)
    parser.version('V', 'version')
    parser.flag('l', 'listen', (key) => { this.options.mode = 'daemon' })
    parser.flag('s', 'service', (key) => { this.options.mode = 'service' })
    parser.option('t', 'timeout', (value, key) => {
      this.options.timeout = homebridgeLib.OptionParser.toInt(
        'timeout', value, 1, 60, true
      )
    })
    parser.parse()
  }

  exit (signal) {
    this.log('got %s - exiting', signal)
    process.exit(0)
  }

  onUp (obj) {
    delete obj.rawTxt
    this.log('found accessory: %s', obj.name, this.jsonFormatter.stringify(obj))
  }

  main () {
    try {
      this.parseArguments()
      this.jsonFormatter = new homebridgeLib.JsonFormatter(
        this.options.mode === 'service'
          ? { noWhiteSpace: true, sortKeys: true } : { sortKeys: true }
      )
      if (this.options.mode) {
        this.setOptions({ mode: this.options.mode })
      } else {
        setTimeout(() => {
          this.log('search done')
          bonjour4.destroy()
          // bonjour6.destroy()
        }, this.options.timeout * 1000)
      }
      this.log('searching for HomeKit accessories')
      const bonjour4 = new Bonjour()
      const browser4 = bonjour4.find({ type: 'hap' })
      browser4.on('up', this.onUp.bind(this))
      // const bonjour6 = new Bonjour({
      //   type: 'udp6',
      //   interface: '::%en0', // TODO: how to determine the interface?!
      //   ip: 'ff02::fb'
      // })
      // const browser6 = bonjour6.find({ type: 'hap' })
      // browser6.on('up', this.onUp.bind(this))
      process.on('SIGINT', () => { this.exit('SIGINT') })
      process.on('SIGTERM', () => { this.exit('SIGTERM') })
    } catch (error) {
      this.fatal(error)
    }
  }
}

new Main().main()
