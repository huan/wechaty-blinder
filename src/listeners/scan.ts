import {
  log,
}         from '../config'

export = function (url: string, code: string) {
  if (!/201|200/.test(String(code))) {
    const loginUrl = url.replace(/\/qrcode\//, '/l/')
  }
  log.info('Listeners/Scan', `${url}\n[${code}] Scan QR Code in above url to login: `)
}
