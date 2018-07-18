import blinder  from '../blinder'
import {
  announce,
  Contact,
}               from '../wechaty'
import {
  log,
}               from '../config'

async function onLogin(user: Contact): Promise<void> {
  const msg = `Der! I just got online, please show me the face! WechatyBlinder v${blinder.version()}`

  log.info('Bot', msg)
  await announce(msg)
}

export default onLogin
