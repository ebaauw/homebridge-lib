// homebridge-lib/lib/UpnpCommand.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.
//
// UPnP tool.

'use strict'

const homebridgeLib = require('../index')

const chalk = require('chalk')

const b = chalk.bold
const u = chalk.underline
const usage = `${b('upnp')} [${b('-hVadnrsz')}] [${b('-c')} ${u('class')}] [${b('-t')} ${u('timeout')}]`
const help = `UPnP tool.

Search for UPnP devices and print found devices as JSON.
When running as daemon or service, log UPnP alive broadcasts as JSON.

Usage: ${usage}

Parameters:
  ${b('-h')}, ${b('--help')}
  Print this help and exit.

  ${b('-V')}, ${b('--version')}
  Print version and exit.

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

class UpnpCommand extends homebridgeLib.CommandLineTool {
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
    this.log('got %s - exiting', signal)
    process.exit(0)
  }

  main () {
    try {
      this.parseArguments()
      const jsonFormatter = new homebridgeLib.JsonFormatter({
        noWhiteSpace: this.options.noWhiteSpace
      })
      const unpnClient = new homebridgeLib.UpnpClient(this.upnp)
      process.on('SIGINT', () => { this.exit('SIGINT') })
      process.on('SIGTERM', () => { this.exit('SIGTERM') })
      unpnClient.on('listening', (host) => { this.log('listening on %s', host) })
      unpnClient.on('deviceAlive', (address, obj, message) => {
        if (!this.options.raw) {
          message = jsonFormatter.stringify(obj)
        }
        this.log('%s: %s', address, message)
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

module.exports = UpnpCommand
