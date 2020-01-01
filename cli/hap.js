#!/usr/bin/env node

// homebridge-lib/cli/hap.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.
//
// Logger for HomeKit accessory announcements.

'use strict'

const homebridgeLib = require('../index')

new homebridgeLib.HapCommand().main()
