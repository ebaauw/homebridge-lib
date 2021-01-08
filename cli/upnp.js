#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2021 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')

const b = chalk.bold
const u = chalk.underline
const usage = `${b('upnp')} [${b('-hVDadnrsz')}] [${b('-c')} ${u('class')}] [${b('-t')} ${u('timeout')}]`
const help = `UPnP tool.

Search for UPnP devices and print found devices as JSON.
When running as daemon or service, log UPnP alive broadcasts as JSON.

Usage: ${usage}

Parameters:
  ${b('-h')}, ${b('--help')}
  Print this help and exit.

  ${b('-V')}, ${b('--version')}
  Print version and exit.

  ${b('-D')}, ${b('--debug')}
  Print debug messages.

  ${b('-a')}, ${b('--all')}
  Short for ${b('-c ssdp:all')}.

  ${b('-c')} ${u('class')}, ${b('--class=')}${u('class')}
  Search for ${u('class')} instead of default ${b('ssdp:rootdevice')}.

  ${b('-d')}, ${b('--daemon')}
  Run as daemon.  Listen for UPnP alive broadcasts instead of searching.

  ${b('-n')}, ${b('--noWhiteSpace')}
  Do not include spaces nor newlines in JSON output.

  ${b('-r')}, ${b('--raw')}
  Do not parse messages, output raw message data instead of JSON.

  ${b('-s')}, ${b('--service')}
  Run as daemon.  Listen for UPnP alive broadcasts instead of searching.

  ${b('-t')} ${u('timeout')}, ${b('--timeout=')}${u('timeout')}
  Search for ${u('timeout')} seconds instead of default ${b('5')}.

  ${b('-z')}, ${b('--ZonePlayer')}
  Short for ${b('-c urn:schemas-upnp-org:device:ZonePlayer:1')}.`

class Main extends homebridgeLib.CommandLineTool {
  constructor () {
    super()
    this.usage = usage
    this.options = {
      noWhiteSpace: false
    }
    this.upnp = {}
  }

  parseArguments () {
    const parser = new homebridgeLib.CommandLineParser()
    parser.help('h', 'help', help)
    parser.version('V', 'version')
    parser.flag('D', 'debug', () => { this.setOptions({ debug: true }) })
    parser.flag('a', 'all', (key) => { this.upnp.class = 'ssdp:all' })
    parser.option('c', 'class', (value, key) => { this.upnp.class = value })
    parser.flag('d', 'daemon', (key) => { this.options.mode = 'daemon' })
    parser.flag('n', 'noWhiteSpace', () => { this.options.noWhiteSpace = true })
    parser.flag('r', 'raw', (key) => { this.options.raw = true })
    parser.flag('s', 'service', (key) => { this.options.mode = 'service' })
    parser.option('t', 'timeout', (value, key) => {
      this.upnp.timeout = homebridgeLib.OptionParser.toInt(
        'timeout', value, 1, 60, true
      )
    })
    parser.flag('z', 'ZonePlayer', (key) => {
      this.upnp.class = 'urn:schemas-upnp-org:device:ZonePlayer:1'
    })
    parser.parse()
  }

  exit (signal) {
    this.debug('got %s - exiting', signal)
    this.upnpClient.stopListen()
    process.exit(0)
  }

  main () {
    try {
      this.parseArguments()
      const jsonFormatter = new homebridgeLib.JsonFormatter({
        noWhiteSpace: this.options.noWhiteSpace
      })
      this.upnpClient = new homebridgeLib.UpnpClient(this.upnp)
      process
        .on('SIGINT', () => { this.exit('SIGINT') })
        .on('SIGTERM', () => { this.exit('SIGTERM') })
      this.upnpClient
        .on('error', (error) => { this.error(error) })
        .on('listening', (host) => { this.debug('listening on %s', host) })
        .on('stopListening', (host) => { this.debug('stopped listening on %s', host) })
        .on('deviceAlive', (address, obj, message) => {
          if (!this.options.raw) {
            message = jsonFormatter.stringify(obj)
          }
          this.log('%s: %s', address, message)
        })
        .on('searching', (host) => { this.debug('listening on %s', host) })
        .on('request', (request) => {
          this.debug(
            '%s: request %d: %s %s', request.host, request.id,
            request.method, request.resource
          )
        })
        .on('searchDone', (host) => { this.debug('search done') })
        .on('deviceFound', (address, obj, message) => {
          if (!this.options.raw) {
            message = jsonFormatter.stringify(obj)
          }
          this.print('%s: %s', address, message)
        })

      if (this.options.mode) {
        this.setOptions({ mode: this.options.mode })
        this.upnpClient.listen()
      } else {
        this.upnpClient.search()
      }
    } catch (error) {
      this.fatal(error)
    }
  }
}

new Main().main()
