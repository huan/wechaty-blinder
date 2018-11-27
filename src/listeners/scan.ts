import {
  log,
}         from '../config'

export = function (qrcode: string, status: number) {
  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('')

  log.info('Listeners/Scan', `${qrcodeImageUrl}\n[${status}]`)
}
