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

const dirList = ['/workdir']

if (config.token) {
  dirList.push(config.token)
}

export const WORKDIR = path.join.apply(null, dirList)

// path.join(
//   APP_ROOT,
//   'workdir',
// )

if (!fs.existsSync(WORKDIR)) {
  fs.mkdirSync(WORKDIR)
}
