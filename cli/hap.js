#!/usr/bin/env node

// homebridge-lib/cli/hap.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2024 Erik Baauw. All rights reserved.
//
// Logger for HomeKit accessory announcements.

import { HapTool } from 'hb-lib-tools'

new HapTool(import.meta.dirname).main()
