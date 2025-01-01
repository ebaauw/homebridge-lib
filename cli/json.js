#!/usr/bin/env node

// homebridge-lib/cli/json.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2025 Erik Baauw. All rights reserved.
//
// JSON formatter.

import { createRequire } from 'node:module'

import { JsonTool } from 'hb-lib-tools/JsonTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new JsonTool(packageJson).main()
