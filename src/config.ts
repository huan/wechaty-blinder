import * as fs    from 'fs'
import * as path  from 'path'

import Brolog from 'brolog'
export const log = new Brolog()
log.level('silly')

import {
  path as APP_ROOT,
}                     from 'app-root-path'

export const WORKDIR = path.join(
  APP_ROOT,
  'workdir',
)

if (!fs.existsSync(WORKDIR)) {
  fs.mkdirSync(WORKDIR)
}
