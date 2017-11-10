import * as fs    from 'fs'
import * as path  from 'path'

import {
  path as APP_ROOT,
}                     from 'app-root-path'

import {
  config,
}                     from 'wechaty'

/**
 * LOG
 */
import Brolog from 'brolog'
export const log = new Brolog()
log.level('verbose')

/**
 * WORKDIR
 */
const dirList = [] as string[]
const WORKDIR_NAME = 'workdir'
if (config.token && fs.existsSync(path.resolve(path.sep, WORKDIR_NAME))) {
  dirList.push(path.sep)  // root
  dirList.push(WORKDIR_NAME)
  dirList.push(config.token)
} else {
  dirList.push(APP_ROOT)
  dirList.push(WORKDIR_NAME)
}

export const WORKDIR = path.join(...dirList)
if (!fs.existsSync(WORKDIR)) {
  fs.mkdirSync(WORKDIR)
}
log.info('Config', 'WORKDIR=%s', WORKDIR)

export const IMAGEDIR = path.join(
  WORKDIR,
  'images',
)
if (!fs.existsSync(IMAGEDIR)) {
  fs.mkdirSync(IMAGEDIR)
}
log.info('Config', 'IMAGEDIR=%s', IMAGEDIR)

/**
 * VERSION
 */
import * as readPkgUp from 'read-pkg-up'
export const VERSION = readPkgUp.sync().pkg.version

export const FACENET_SECRET = process.env['FACENET_SECRET'] || 'facenet'
log.verbose('Config', 'FACENET_SECRET=%s', FACENET_SECRET)

export const GITHUB_URL_QRCODE = path.join(
  APP_ROOT,
  'docs',
  'images',
  'github-url-qrcode.png',
)
