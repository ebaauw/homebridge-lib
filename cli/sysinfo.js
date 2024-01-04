#!/usr/bin/env node

// homebridge-lib/cli/sysinfo.js
//
// Library for Homebridge plugins.
// Copyright © 2021-2024 Erik Baauw. All rights reserved.
//
// Show system info.

'use strict'

const { SysinfoTool } = require('hb-lib-tools')

new SysinfoTool(require('../package.json')).main()
