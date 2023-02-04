#!/usr/bin/env node

// homebridge-lib/cli/sysinfo.js
//
// Library for Homebridge plugins.
// Copyright © 2021-2023 Erik Baauw. All rights reserved.
//
// Show system info.

'use strict'

const { SysinfoTool } = require('../index')

new SysinfoTool().main()
