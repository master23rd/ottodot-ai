import 'dotenv/config'
import { verifySmtpConnection } from '../src/lib/mail.server'

verifySmtpConnection()
  .then(() => console.info('SMTP connection and authentication succeeded'))
  .catch((error: unknown) => {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN'
    console.error(`SMTP verification failed (${code})`)
    process.exitCode = 1
  })
