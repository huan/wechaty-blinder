import {
  config,
  IoClient,
  log,
  Wechaty,
}             from 'wechaty'

export const wechaty = Wechaty.instance({
  profile: 'blinder',
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
}

export default wechaty
