import { describe, expect, it } from 'vitest'
import { hashActivationToken, newActivationToken, operatorActivationUrl } from './operator-activation.server'

describe('operator activation primitives', () => {
  it('creates opaque, hashed, short-lived tokens', () => {
    const before = Date.now()
    const activation = newActivationToken()
    expect(activation.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(activation.tokenHash).toBe(hashActivationToken(activation.token))
    expect(activation.tokenHash).not.toContain(activation.token)
    expect(activation.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 48 * 60 * 60 * 1000)
  })

  it('routes admin and teacher links to different activation screens', () => {
    expect(operatorActivationUrl('admin', 'one', 'https://ottodot.example')).toBe('https://ottodot.example/activate#token=one')
    expect(operatorActivationUrl('teacher', 'two', 'https://ottodot.example')).toBe('https://ottodot.example/activate-teacher#token=two')
    expect(operatorActivationUrl('staff', 'three', 'https://ottodot.example')).toBe('https://ottodot.example/activate-staff#token=three')
  })
})
