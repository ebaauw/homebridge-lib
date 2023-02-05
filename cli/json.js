#!/usr/bin/env node

// homebridge-lib/cli/json.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2023 Erik Baauw. All rights reserved.
//
// JSON formatter.

'use strict'

const { JsonTool } = require('hb-lib-tools')

new JsonTool(require('../package.json')).main()
