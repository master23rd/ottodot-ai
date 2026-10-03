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

type ActivationRecipient = { to: string; name: string; activationUrl: string }
type MailFrom = { name: string; address: string }

function activationMessage(input: ActivationRecipient, from: MailFrom, role: 'admin' | 'teacher') {
  return {
    from,
    to: input.to,
    subject: `Aktifkan akun ${role} OttoDot`,
    text: `Halo ${input.name},\n\nAkun ${role} OttoDot Anda telah dibuat. Buka tautan berikut untuk menetapkan kata sandi:\n\n${input.activationUrl}\n\nTautan berlaku 48 jam dan hanya dapat digunakan sekali. Jika Anda tidak mengenali undangan ini, abaikan email ini.\n\nOttoDot`,
  }
}

export function adminActivationMessage(input: ActivationRecipient, from: MailFrom) {
  return activationMessage(input, from, 'admin')
}

export function teacherActivationMessage(input: ActivationRecipient, from: MailFrom) {
  return activationMessage(input, from, 'teacher')
}

async function sendActivationEmail(input: ActivationRecipient, role: 'admin' | 'teacher') {
  const transport = smtpTransport()
  try {
    const info = await transport.sendMail(activationMessage(input, smtpConfig().from, role))
    if (!info.accepted.some((address) => address.toLowerCase() === input.to.toLowerCase())) {
      throw new Error('SMTP_RECIPIENT_REJECTED')
    }
  } finally {
    transport.close()
  }
}

export function sendAdminActivationEmail(input: ActivationRecipient) {
  return sendActivationEmail(input, 'admin')
}

export function sendTeacherActivationEmail(input: ActivationRecipient) {
  return sendActivationEmail(input, 'teacher')
}

export async function verifySmtpConnection() {
  const transport = smtpTransport()
  try { await transport.verify() }
  finally { transport.close() }
}
