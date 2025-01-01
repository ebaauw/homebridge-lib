#!/usr/bin/env node

// homebridge-lib/cli/sysinfo.js
//
// Library for Homebridge plugins.
// Copyright © 2021-2025 Erik Baauw. All rights reserved.
//
// Show system info.

import { createRequire } from 'node:module'

import { SysinfoTool } from 'hb-lib-tools/SysinfoTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new SysinfoTool(packageJson).main()
