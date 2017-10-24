import * as path from 'path'

import {
  config,
  IoClient,
  log,
  Wechaty,
}             from 'wechaty'

import {
  WORKDIR,
}             from './config'

const profile = path.join(WORKDIR, 'wechaty-blinder')

export const wechaty = Wechaty.instance({
  profile,
})

const token = config.token
if (token) {
  log.verbose('Wechaty', 'TOKEN: %s', token)
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

export default wechaty
