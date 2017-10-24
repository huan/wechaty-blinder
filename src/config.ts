import * as fs    from 'fs'
import * as path  from 'path'

import Brolog from 'brolog'
export const log = new Brolog()
log.level('silly')

import {
  path as APP_ROOT,
}                     from 'app-root-path'

import {
  config,
}                     from 'wechaty'

const dirList = []

if (config.token) {
  dirList.concat([
    '/workdir', 
    config.token,
  ])
} else {
  dirList.concat([
    APP_ROOT,
    'workdir',
  ])
}

export const WORKDIR = path.join.apply(null, dirList)

// path.join(
//   APP_ROOT,
//   'workdir',
// )

if (!fs.existsSync(WORKDIR)) {
  fs.mkdirSync(WORKDIR)
}
