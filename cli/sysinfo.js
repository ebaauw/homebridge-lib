#!/usr/bin/env node

// homebridge-lib/cli/sysinfo.js
//
// Library for Homebridge plugins.
// Copyright © 2021-2022 Erik Baauw. All rights reserved.
//
// Show system info.

'use strict'

const homebridgeLib = require('../index')

const { b } = homebridgeLib.CommandLineTool

const usage = `${b('sysinfo')} [${b('-hVDj')}]`
const help = `System information tool.

Print Hardware and Operating System information.

Usage: ${usage}

Parameters:
  ${b('-h')}, ${b('--help')}
  Print this help and exit.

  ${b('-V')}, ${b('--version')}
  Print version and exit.

  ${b('-D')}, ${b('--debug')}
  Print debug messages.

  ${b('-j')}, ${b('--json')}
  Print full info in json.`

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
    parser
      .help('h', 'help', help)
      .version('V', 'version')
      .flag('D', 'debug', () => { this.setOptions({ debug: true }) })
      .flag('j', 'json', () => { this.json = true })
      .parse()
  }

  async main () {
    try {
      this.parseArguments()
      this.systemInfo = new homebridgeLib.SystemInfo()
      this.systemInfo
        .on('error', (error) => { this.error(error) })
        .on('exec', (command) => { this.debug('exec: %s', command) })
        .on('readFile', (fileName) => { this.debug('read file: %s', fileName) })
      await this.systemInfo.init()
      if (this.json) {
        const jsonFormatter = new homebridgeLib.JsonFormatter(this.options)
        this.print(jsonFormatter.stringify({
          hardware: this.systemInfo.hwInfo,
          os: this.systemInfo.osInfo
        }))
      } else {
        this.print(this.systemInfo.hwInfo.prettyName)
        this.print(this.systemInfo.osInfo.prettyName)
      }
    } catch (error) {
      await this.fatal(error)
    }
  }
}

new Main().main()
