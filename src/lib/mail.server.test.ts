import { describe, expect, it } from 'vitest'
import { adminActivationMessage, smtpConfig } from './mail.server'

describe('admin activation email', () => {
  it('requires STARTTLS for the configured port and resolves the sender name', () => {
    const config = smtpConfig({
      APP_NAME: 'OttoDot', MAIL_MAILER: 'smtp', MAIL_HOST: 'smtp.gmail.com', MAIL_PORT: '587',
      MAIL_USERNAME: 'sender@example.com', MAIL_PASSWORD: 'test-only', MAIL_ENCRYPTION: 'tls',
      MAIL_FROM_ADDRESS: 'sender@example.com', MAIL_FROM_NAME: '${APP_NAME}',
    })
    expect(config).toMatchObject({ port: 587, secure: false, requireTLS: true, from: { name: 'OttoDot', address: 'sender@example.com' } })
  })

  it('sends the one-time URL only to the intended admin', () => {
    const url = 'http://localhost:3000/activate#token=test-only-token'
    const message = adminActivationMessage(
      { to: 'admin@example.com', name: 'Admin', activationUrl: url },
      { name: 'OttoDot', address: 'sender@example.com' },
    )
    expect(message.to).toBe('admin@example.com')
    expect(message.text).toContain(url)
    expect(message.text).toContain('48 jam')
    expect(message.text).not.toContain('kata sandi sementara')
  })
})
