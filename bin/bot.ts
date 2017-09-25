import {
  log,
}         from '../src/config'
import {
  Bot,
}         from '../src/bot'

async function main(): Promise<number> {
  log.level('verbose')
  log.verbose('Main', 'main()')

  const bot = new Bot()
  try {
    await bot.run()
  } catch (e) {
    log.error('Main', e)
    return 1
  } finally {
    await bot.quit()
  }
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
