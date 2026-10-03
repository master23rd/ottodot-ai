import nodemailer from 'nodemailer'

export function smtpConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.MAIL_MAILER !== 'smtp' || !env.MAIL_HOST || !env.MAIL_USERNAME || !env.MAIL_PASSWORD || !env.MAIL_FROM_ADDRESS) {
    throw new Error('SMTP_CONFIGURATION_MISSING')
  }
  const port = Number(env.MAIL_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT_INVALID')
  if (env.MAIL_ENCRYPTION !== 'tls' && env.MAIL_ENCRYPTION !== 'ssl') throw new Error('SMTP_ENCRYPTION_INVALID')
  const fromName = env.MAIL_FROM_NAME === '${APP_NAME}' ? env.APP_NAME || 'OttoDot' : env.MAIL_FROM_NAME || env.APP_NAME || 'OttoDot'
  return {
    host: env.MAIL_HOST,
    port,
    secure: env.MAIL_ENCRYPTION === 'ssl',
    requireTLS: env.MAIL_ENCRYPTION === 'tls',
    auth: { user: env.MAIL_USERNAME, pass: env.MAIL_PASSWORD },
    from: { name: fromName, address: env.MAIL_FROM_ADDRESS },
  }
}

function smtpTransport() {
  const settings = smtpConfig()
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: settings.requireTLS,
    auth: settings.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
}

export function adminActivationMessage(input: { to: string; name: string; activationUrl: string }, from: { name: string; address: string }) {
  return {
    from,
    to: input.to,
    subject: 'Aktifkan akun admin OttoDot',
    text: `Halo ${input.name},\n\nAkun admin OttoDot Anda telah dibuat. Buka tautan berikut untuk menetapkan kata sandi:\n\n${input.activationUrl}\n\nTautan berlaku 48 jam dan hanya dapat digunakan sekali. Jika Anda tidak mengenali undangan ini, abaikan email ini.\n\nOttoDot`,
  }
}

export async function sendAdminActivationEmail(input: { to: string; name: string; activationUrl: string }) {
  const transport = smtpTransport()
  try {
    const info = await transport.sendMail(adminActivationMessage(input, smtpConfig().from))
    if (!info.accepted.some((address) => address.toLowerCase() === input.to.toLowerCase())) {
      throw new Error('SMTP_RECIPIENT_REJECTED')
    }
  } finally {
    transport.close()
  }
}

export async function verifySmtpConnection() {
  const transport = smtpTransport()
  try { await transport.verify() }
  finally { transport.close() }
}
