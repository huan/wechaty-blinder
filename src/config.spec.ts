#!/usr/bin/env ts-node

// tslint:disable:no-shadowed-variable
import * as test  from 'blue-tape'
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)

import {
  VERSION,
}           from './config'

test('VERSION', async t => {
  t.ok(/^\d+\.\d+\.\d+$/.test(VERSION), 'should get semvar version')
})
