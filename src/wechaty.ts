import * as path from 'path'

import {
  config,
  IoClient,
  // log as wechatyLog,
  Wechaty,
}             from 'wechaty'

import {
  log,
  WORKDIR,
}             from './config'

// wechatyLog.level(log.level())

const profile = path.join(WORKDIR, 'wechaty-blinder')

export const wechaty = Wechaty.instance({
  profile,
})

const token = config.token
if (token) {
  log.info('Wechaty', 'TOKEN: %s', token)
  const client = new IoClient({
    token,
    wechaty,
  })

  client.init().catch(e => {
    log.error('Wechaty', 'IoClient.init() exception: %s', e)
    wechaty.emit('error', e)
  })
} else {
  log.verbose('Wechaty', 'TOKEN: N/A')
}

log.info('Wechaty', `v${wechaty.version()}`)

export default wechaty
