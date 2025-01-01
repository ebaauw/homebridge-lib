#!/usr/bin/env node

// homebridge-lib/cli/hap.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2025 Erik Baauw. All rights reserved.
//
// Logger for HomeKit accessory announcements.

import { createRequire } from 'node:module'

import { HapTool } from 'hb-lib-tools/HapTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new HapTool(packageJson).main()
