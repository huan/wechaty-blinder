import blinder  from '../blinder'
import {
  announce,
  Contact,
  Sayable,
}               from '../wechaty'
import {
  log,
}               from '../config'

async function onLogin(this: Sayable, user: Contact): Promise<void> {
  const msg = `Der! I'm online now! WechatyBlinder v${blinder.version()}`

  log.info('Bot', msg)
  await announce(msg)
}

export default onLogin
