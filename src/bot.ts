import {
  log,
}                 from './config'

import blinder    from './blinder'
import wechaty    from './wechaty'

export class Bot {

  constructor() {
    log.verbose('Bot', 'constructor()')
  }

  public async run(): Promise<void> {
    log.verbose('Bot', 'run()')

    wechaty
    .on('scan',     './listeners/scan')
    .on('logout',   './listeners/logout')
    .on('error',    './listeners/error')
    .on('login',    './listeners/login')
    .on('message',  './listeners/message')

    log.info('Bot', 'run() blinder is initializing... please wait(20-200s)...')
    await blinder.init()
    log.info('Bot', 'run() blinder initialized')

    await wechaty.init()

    await new Promise<void>((resolve, reject) => {
      wechaty.on('logout', () => resolve())
      wechaty.on('error', reject)
    })
  }

  public async quit(): Promise<void> {
    await wechaty.quit()
  }
}
