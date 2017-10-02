// import {
//   log as logWechaty,
// }                     from 'wechaty'
import {
  log as logHotImport,
}                     from 'wechaty/node_modules/hot-import/'

import {
  log,
}         from '../src/config'
import {
  Brain,
}         from '../src/brain'

async function main(): Promise<number> {
  // logWechaty.level('verbose')
  logHotImport.level('verbose')
  log.level('verbose')
  log.verbose('Main', 'main()')

  const brain = new Brain()
  try {
    await brain.start()
  } catch (e) {
    log.error('Main', e)
    return 1
  } finally {
    await brain.stop()
  }
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
