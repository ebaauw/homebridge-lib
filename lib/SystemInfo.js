// homebridge-lib/lib/SystemInfo.js
//
// Library for Homebridge plugins.
// Copyright © 2019-2022 Erik Baauw. All rights reserved.

'use strict'

const events = require('events')
const { exec, execFile } = require('child_process')
const fs = require('fs').promises
const os = require('os')
const semver = require('semver')

const homebridgeLib = require('../index')

const rpiInfo = {
  manufacturers: {
    0: 'Sony UK',
    1: 'Egoman',
    2: 'Embest',
    3: 'Sony Japan',
    4: 'Embest',
    5: 'Stadium'
  },
  memorySizes: {
    0: '256MB',
    1: '512MB',
    2: '1GB',
    3: '2GB',
    4: '4GB',
    5: '8GB'
  },
  models: {
    0: 'A',
    1: 'B',
    2: 'A+',
    3: 'B+',
    4: '2B',
    5: 'Alpha', // early prototype
    6: 'CM1',
    8: '3B',
    9: 'Zero',
    10: 'CM3',
    12: 'Zero W',
    13: '3B+',
    14: '3A+',
    // 15: '', // Internal use only
    16: 'CM3+',
    17: '4B',
    18: 'Zero 2 W',
    19: '400',
    20: 'CM4'
  },
  processors: {
    0: 'BCM2835',
    1: 'BCM2836',
    2: 'BCM2837',
    3: 'BCM2711'
  },
  oldRevisions: {
    2: { model: 'B', revision: '1.0', memory: '256MB', manufacturer: 'Egoman' },
    3: { model: 'B', revision: '1.0', memory: '256MB', manufacturer: 'Egoman' },
    4: { model: 'B', revision: '2.0', memory: '256MB', manufacturer: 'Sony UK' },
    5: { model: 'B', revision: '2.0', memory: '256MB', manufacturer: 'Qisda' },
    6: { model: 'B', revision: '2.0', memory: '256MB', manufacturer: 'Egoman' },
    7: { model: 'A', revision: '2.0', memory: '256MB', manufacturer: 'Egoman' },
    8: { model: 'A', revision: '2.0', memory: '256MB', manufacturer: 'Sony UK' },
    9: { model: 'A', revision: '2.0', memory: '256MB', manufacturer: 'Qisda' },
    13: { model: 'B', revision: '2.0', memory: '512MB', manufacturer: 'Egoman' },
    14: { model: 'B', revision: '2.0', memory: '512MB', manufacturer: 'Sony UK' },
    15: { model: 'B', revision: '2.0', memory: '512MB', manufacturer: 'Egoman' },
    16: { model: 'B+', revision: '1.2', memory: '512MB', manufacturer: 'Sony UK' },
    17: { model: 'CM1', revision: '1.0', memory: '512MB', manufacturer: 'Sony UK' },
    18: { model: 'A+', revision: '1.1', memory: '256MB', manufacturer: 'Sony UK' },
    19: { model: 'B+', revision: '1.2', memory: '512MB', manufacturer: 'Embest' },
    20: { model: 'CM1', revision: '1.0', memory: '512MB', manufacturer: 'Embest' },
    21: { model: 'A+', revision: '1.1', memory: '256MB/512MB', manufacturer: 'Embest' }
  }
}

// See: https://en.wikipedia.org/wiki/MacOS_version_history
const macOsInfo = {
  versionNames: {
    '10.0': 'Cheetah',
    10.1: 'Puma',
    10.2: 'Jaguar',
    10.3: 'Panther',
    10.4: 'Tiger',
    10.5: 'Leopard',
    10.6: 'Snow Leopard',
    10.7: 'Lion',
    10.8: 'Mountain Lion',
    10.9: 'Mavericks',
    '10.10': 'Yosemite',
    10.11: 'El Capitan',
    10.12: 'Sierra',
    10.13: 'High Sierra',
    10.14: 'Mojave',
    10.15: 'Catalina',
    11: 'Big Sur',
    12: 'Monterey'
  }
}

/** System information.
  * @extends EventEmitter
  */
class SystemInfo extends events.EventEmitter {
  /** Extract Raspberry Pi serial number and hardware revision info from the
    * contents of `/proc/cpuinfo`.
    * @param {string} cpuInfo - The contents of `/proc/cpuinfo`.
    * @return {object} - The extracted info.
    */
  static parseRpiCpuInfo (cpuInfo) {
    let a = /Serial\s*: ([0-9a-f]{16})/.exec(cpuInfo)
    if (a == null || a.length < 2) {
      return null
    }
    const id = a[1].toUpperCase()
    a = /Revision\s*: ([0-9a-f]{4,})/.exec(cpuInfo)
    if (a == null || a.length < 2) {
      return null
    }
    const revision = parseInt(a[1], 16) & 0x00FFFFFF
    let gpioMask, manufacturer, memory, model, modelRevision, processor
    if ((revision & 0x00800000) !== 0) { // New revision scheme.
      manufacturer = rpiInfo.manufacturers[(revision & 0x000F0000) >> 16]
      memory = rpiInfo.memorySizes[(revision & 0x00700000) >> 20]
      model = rpiInfo.models[(revision & 0x00000FF0) >> 4]
      modelRevision = '1.' + ((revision & 0x0000000F) >> 0).toString()
      processor = rpiInfo.processors[(revision & 0x0000F000) >> 12]
    } else if (rpiInfo.oldRevisions[revision] != null) { // Old incremental revisions.
      manufacturer = rpiInfo.oldRevisions[revision].manufacturer
      memory = rpiInfo.oldRevisions[revision].memory
      model = rpiInfo.oldRevisions[revision].model
      modelRevision = rpiInfo.oldRevisions[revision].revision
      processor = 'BCM2835'
    }
    if (model != null && model.startsWith('CM')) {
      // Compute module
      gpioMask = 0xFFFFFFFF // 0-31
    } else if (revision >= 16) {
      // Type 3
      gpioMask = 0x0FFFFFFC // 2-27
    } else if (revision >= 4) {
      // Type 2
      gpioMask = 0xFBC6CF9C // 2-4, 7-11, 14-15, 17-18, 22-25, 27-31
    } else {
      // Type 1
      gpioMask = 0x03E6CF93 // 0-1, 4, 7-11, 14-15, 17-18, 21-25
    }
    return {
      gpioMask,
      gpioMaskSerial: (1 << 15) | (1 << 14),
      id,
      isRpi: true,
      manufacturer,
      memory,
      model,
      modelRevision,
      prettyName: [
        'Raspberry Pi', model, modelRevision, '(' + memory + ')'
      ].join(' '),
      powerLed: !(['A', 'B', 'Zero', 'Zero W', 'Zero 2 W'].includes(model)),
      processor,
      revision: homebridgeLib.toHexString(revision, 6),
      usbPower: ['B+', '2B', '3B', '3B+'].includes(model)
    }
  }

  /** Initialise SystemInfo instance.
    */
  async init () {
    switch (process.platform) {
      case 'linux':
        if (await this.existsFile('/etc/synoinfo.conf')) {
          try {
            this.osInfo = await this.getDsmInfo()
          } catch (error) { this.emit('error', error) }
          try {
            this.hwInfo = await this.getSynoInfo()
          } catch (error) { this.emit('error', error) }
        } else {
          try {
            this.osInfo = await this.getPiOsInfo()
          } catch (error) { this.emit('error', error) }
          if (['arm', 'arm64'].includes(process.arch)) {
            try {
              this.hwInfo = await this.getRpiInfo()
            } catch (error) { this.emit('error', error) }
          }
        }
        break
      case 'darwin':
        try {
          this.osInfo = await this.getMacOsInfo()
        } catch (error) { this.emit('error', error) }
        try {
          this.hwInfo = await this.getMacInfo()
        } catch (error) { this.emit('error', error) }
        break
      default:
        break
    }
    if (this.osInfo == null) {
      this.osInfo = {
        name: process.platform,
        platform: process.platform,
        prettyName: process.platform
      }
    }
    if (this.hwInfo == null) {
      this.hwInfo = {
        nCores: os.cpus().length,
        prettyName: process.arch,
        processor: process.arch
      }
    }
    this.platform = this.osInfo.platform
  }

  /** Extract serial number and hardware revision info from `/proc/cpuinfo`.
    * @return {object} - The extracted info.
    */
  async getRpiInfo () {
    const cpuInfo = await this.readTextFile('/proc/cpuinfo')
    return SystemInfo.parseRpiCpuInfo(cpuInfo)
  }

  /** Extract OS info from /etc/os-release.
    * @return {object} - The extracted info.
    */
  async getPiOsInfo () {
    let name, platform, prettyName, version, versionName
    const text = await this.readTextFile('/etc/os-release')
    const lines = text.replace(/"/g, '').split('\n')
    for (const line of lines) {
      const fields = line.split('=')
      if (fields.length === 2) {
        switch (fields[0]) {
          case 'ID':
            platform = fields[1] // e.g. 'raspbian'
            break
          case 'NAME':
            name = fields[1] // e.g. 'Raspbian GNU/Linux'
            break
          case 'PRETTY_NAME':
            prettyName = fields[1] // e.g. 'Raspbian GNU/Linux 11 (bullseye)'
            break
          case 'VERSION_CODENAME':
            versionName = fields[1] // e.g. 'bullseye'
            break
          case 'VERSION_ID':
            version = fields[1] // e.g. '11'
            break
          default:
            break
        }
      }
    }
    return { name, platform, prettyName, version, versionName }
  }

  /** Extract Apple Mac hardware info from `system_profiler` command.
    * @return {object} - The extracted info.
    */
  async getMacInfo () {
    let id, memory, model, nCores, prettyName, processor, revision
    let text = await this.exec('system_profiler', 'SPHardwareDataType')
    const lines = text.split('\n')
    for (const line of lines) {
      const fields = line.split(': ')
      if (fields.length === 2) {
        switch (fields[0].trim()) {
          case 'Memory':
            memory = fields[1].replace(/ /g, '')
            break
          case 'Model Identifier':
            revision = fields[1]
            break
          case 'Model Name':
            model = fields[1]
            break
          case 'Chip':
          case 'Processor Name':
            processor = fields[1]
            break
          case 'Serial Number (system)':
            id = fields[1]
            break
          case 'Total Number of Cores':
            nCores = fields[1].split(' ')[0]
            break
          default:
            break
        }
      }
    }
    try {
      if (process.arch === 'x64') { // Intel
        text = await this.exec(
          'plutil', '-p',
          process.env.HOME + '/Library/Preferences/com.apple.SystemProfiler.plist'
        )
        const regexp = RegExp(
          '"(' + id.slice(-4) + '|' + id.slice(-3) + ').*" => "(.*)"'
        )
        const a = regexp.exec(text)
        if (a != null) {
          prettyName = a[2]
        }
      } else { // Apple silicon
        text = await this.execShell('ioreg -l | grep product-description')
        const a = /"product-description" = <"([^"]*)">/.exec(text)
        if (a != null) {
          prettyName = a[1]
        }
      }
    } catch (error) {
      this.emit('error', error)
    }
    return {
      id,
      isMac: true,
      manufacturer: 'Apple Inc.',
      memory,
      model,
      nCores,
      prettyName: prettyName || model,
      processor,
      revision
    }
  }

  /** Extract macOS info from `sw_vers` command.
    * @return {object} - The extracted info.
    */
  async getMacOsInfo () {
    let name, version, build
    const text = await this.exec('sw_vers')
    const lines = text.split('\n')
    for (const line of lines) {
      const fields = line.split(':\t')
      if (fields.length === 2) {
        switch (fields[0]) {
          case 'ProductName': // e.g. 'macOS' or 'Mac OS X'
            name = fields[1]
            break
          case 'ProductVersion': // e.g. '12.0.1' or '12.1'
            version = fields[1]
            if (version.split('.').length === 2) {
              version += '.0'
            }
            break
          case 'BuildVersion': // e.g. '21A559'
            build = fields[1]
            break
          default:
            break
        }
      }
    }
    let v = semver.major(version)
    if (v === 10) {
      v += '.' + semver.minor(version)
    }
    const versionName = macOsInfo.versionNames[v] // e.g. 'Monterey'
    return {
      build,
      catalina: semver.gte(version, '10.15.0'),
      name,
      platform: process.platform,
      prettyName: [name, versionName, version, '(' + build + ')'].join(' '),
      version,
      versionName
    }
  }

  /** Extract Synology info from `/etc/synoinfo.conf`
    * @return {object} - The extracted info.
    */
  async getSynoInfo () {
    let device = ''
    let id
    let model = ''
    const text = await this.readTextFile('/etc/synoinfo.conf')
    const lines = text.replace(/"/g, '').split('\n')
    for (const line of lines) {
      const fields = line.split('=')
      if (fields.length === 2) {
        switch (fields[0].trim()) {
          case 'pushservice_dsserial':
            id = fields[1] // e.g 1970PDN255608
            break
          case 'upnpdevicetype':
            device = fields[1] // e.g. DiskStation
            break
          case 'upnpmodelname':
            model = fields[1] // e.g. DS918+
            break
          default:
            break
        }
      }
    }
    return {
      id,
      manufacturer: 'Synology',
      model: [device, model].join(' '),
      prettyName: ['Synologgy', device, model].join(' ')
    }
  }

  /** Extract DSM info from `/etc/VERSION`.
    * @return {object} - The extracted info.
    */
  async getDsmInfo () {
    let build, prettyName, update, version
    const text = await this.readTextFile('/etc/VERSION')
    const lines = text.replace(/"/g, '').split('\n')
    for (const line of lines) {
      const fields = line.split('=')
      if (fields.length === 2) {
        switch (fields[0].trim()) {
          case 'buildnumber':
            build = fields[1] // e.g. 42661
            break
          case 'productversion':
            version = fields[1] // e.g. 7.1
            break
          case 'smallfixnumber':
            update = fields[1] // e.g. 3
            break
          default:
            break
        }
      }
    }
    prettyName = 'DSM'
    if (version != null) {
      prettyName += ' ' + version
      if (build != null) {
        prettyName += '-' + build
      }
      if (update != null) {
        prettyName += ' Update ' + update
      }
    }
    return {
      build,
      prettyName,
      update,
      version
    }
  }

  /** Execute a command on the local machine.
    * @param {string} command - The command.
    * @param {...string} ...args - The command parameters.
    * @return {string} - The output of the command.
    */
  async exec (command, ...args) {
    return new Promise((resolve, reject) => {
      /** Emitted when a command is executed.
        * @event SystemInfo#exec
        * @param {string} command - The command.
        */
      this.emit('exec', command + ' ' + args.join(' '))
      execFile(command, args, null, (error, stdout, stderr) => {
        if (error != null) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }

  /** Execute a shell command on the local machine.
    * @param {string} command - The command.
    * @return {string} - The output of the command.
    */
  async execShell (command) {
    return new Promise((resolve, reject) => {
      this.emit('exec', command)
      exec(command, (error, stdout, stderr) => {
        if (error != null) {
          reject(error)
        }
        resolve(stdout)
      })
    })
  }

  /** Check if file exists.
    * @param {string} fileName - The file name.
    * @return {bool} - True iff file exists,
    */
  async existsFile (fileName) {
    try {
      await fs.access(fileName)
      return true
    } catch (error) {}
    return false
  }

  /** Read a text file.
    * @param {string} fileName - The file name.
    * @return {string} - The contents of the file.
    */
  async readTextFile (fileName) {
    /** Emitted when a file is read.
      * @event SystemInfo#readFile
      * @param {string} fileName - The file name.
      */
    this.emit('readFile', fileName)
    return fs.readFile(fileName, 'utf8')
  }
}

module.exports = SystemInfo
