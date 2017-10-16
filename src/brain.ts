import {
  log,
}                 from './config'

// import blinder    from './blinder'
import wechaty    from './wechaty'

export class Brain {

  constructor() {
    log.verbose('Brain', 'constructor()')
  }

  public async start(): Promise<void> {
    log.verbose('Brain', 'start()')

    wechaty
    .on('scan',     './listeners/scan')
    .on('logout',   './listeners/logout')
    .on('error',    './listeners/error')
    .on('login',    './listeners/login')
    .on('message',  './listeners/message')

    log.info('Brain', 'start() blinder is initializing, please wait... (need 20 to 200 seconds before initialized)')
    const timeStart = Date.now()
    // await blinder.init()
    const duration = (Date.now() - timeStart) / 1000
    log.info('Brain', 'start() blinder initialized, cost %s seconds', duration.toFixed(0))

    await wechaty.init()

    await new Promise<void>((resolve, reject) => {
      wechaty.on('logout', () => resolve())
      wechaty.on('error', reject)
    })
  }

  public async stop(): Promise<void> {
    await wechaty.quit()
  }
}
