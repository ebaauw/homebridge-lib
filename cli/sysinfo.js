#!/usr/bin/env node

// homebridge-lib/cli/sysinfo.js
//
// Library for Homebridge plugins.
// Copyright © 2021-2024 Erik Baauw. All rights reserved.
//
// Show system info.

import { SysinfoTool } from 'hb-lib-tools'

new SysinfoTool(import.meta.dirname).main()
