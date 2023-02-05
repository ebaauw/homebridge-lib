#!/usr/bin/env node

// homebridge-lib/cli/hap.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2023 Erik Baauw. All rights reserved.
//
// Logger for HomeKit accessory announcements.

'use strict'

const { HapTool } = require('hb-lib-tools')

new HapTool(require('../package.json')).main()
