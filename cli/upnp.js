#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')

const b = chalk.bold
const u = chalk.underline
const usage = `${b('upnp')} [${b('-hValrs')}] [${b('-c')} ${u('class')}] [${b('-t')} ${u('timeout')}]`
const help = `Logger for UPnP device announcements.

Usage: ${usage}

Search for UPnP devices.
Parameters:
  ${b('-h')}          Print this help and exit.
  ${b('-V')}          Print version and exit.
  ${b('-a')}          Short for ${b('-c ssdp:all')}.
  ${b('-c')} ${u('class')}    Search for ${u('class')} instead of default ${b('ssdp:rootdevice')}.
  ${b('-l')}          Listen for UPnP alive broadcasts instead of searching.
  ${b('-r')}          Do not parse messages, output raw message data.
  ${b('-s')}          Do not output timestamps (useful when running as service).
  ${b('-t')} ${u('timeout')}  Search for ${u('timeout')} seconds instead of default ${b('5')}.`

class Main extends homebridgeLib.CommandLineTool {
  constructor () {
    super()
    this.usage = usage
    this.options = {}
    this.upnp = {}
  }

  parseArguments () {
    const parser = new homebridgeLib.CommandLineParser()
    parser.help('h', 'help', help)
    parser.version('V', 'version')
    parser.flag('a', 'all', (key) => { this.upnp.class = 'ssdp:all' })
    parser.option('c', 'class', (value, key) => { this.upnp.class = value })
    parser.flag('l', 'listen', (key) => { this.options.mode = 'daemon' })
    parser.flag('r', 'raw', (key) => { this.options.raw = true })
    parser.flag('s', 'service', (key) => { this.options.mode = 'service' })
    parser.option('t', 'timeout', (value, key) => {
      this.upnp.timeout = homebridgeLib.OptionParser.toInt(value, 1, 60, true)
    })
    parser.parse()
  }

  exit (signal) {
    this.log('got %s - exiting', signal)
    process.exit(0)
  }

  main () {
    try {
      this.parseArguments()
      const jsonFormatter = new homebridgeLib.JsonFormatter(
        this.options.mode === 'service' ? { noWhiteSpace: true } : {}
      )
      const unpnClient = new homebridgeLib.UpnpClient(this.upnp)
      process.on('SIGINT', () => { this.exit('SIGINT') })
      process.on('SIGTERM', () => { this.exit('SIGTERM') })
      unpnClient.on('listening', (host) => { this.log('listening on %s', host) })
      unpnClient.on('deviceAlive', (address, obj, message) => {
        if (!this.options.raw) {
          message = jsonFormatter.stringify(obj)
        }
        this.print('%s: %s', address, message)
      })
      unpnClient.on('searching', (host) => { this.log('searching on %s', host) })
      unpnClient.on('searchDone', () => { this.log('search done') })
      unpnClient.on('deviceFound', (address, obj, message) => {
        if (!this.options.raw) {
          message = jsonFormatter.stringify(obj)
        }
        this.print('%s: %s', address, message)
      })
      unpnClient.on('error', (err) => { this.error(err) })
      if (this.options.mode) {
        this.setOptions({ mode: this.options.mode })
        unpnClient.listen()
      } else {
        unpnClient.search()
      }
    } catch (err) {
      this.fatal(err)
    }
  }
}

new Main().main()
