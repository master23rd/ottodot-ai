import { describe, expect, it } from 'vitest'
import type { PrismaClient } from '../src/generated/prisma/client'
import { readBootstrapConfig, seedSuperadmin } from './seed'

const config = {
  databaseUrl: 'postgresql://unused',
  email: 'owner@example.com',
  name: 'Owner',
  password: 'a-secure-test-password',
}

function fakeClient() {
  const users: Array<{ id: string; email: string; role: string }> = []
  const accounts: Array<{ userId: string; password: string | null }> = []
  const client = {
    user: {
      findFirst: async () => users.find((user) => user.role === 'SUPERADMIN') ?? null,
      create: async ({ data }: { data: { id: string; email: string; role: string } }) => {
        users.push(data)
        return data
      },
    },
    account: {
      create: async ({ data }: { data: { userId: string; password: string | null } }) => {
        accounts.push(data)
        return data
      },
    },
    $transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback(client),
  }
  return { client: client as unknown as PrismaClient, users, accounts }
}

describe('superadmin bootstrap', () => {
  it('creates one credential account and keeps it unchanged on rerun', async () => {
    const { client, users, accounts } = fakeClient()
    const first = await seedSuperadmin(config, client)
    const hash = accounts[0]?.password
    const second = await seedSuperadmin(config, client)

    expect(first.created).toBe(true)
    expect(second).toEqual({ created: false, userId: first.userId })
    expect(users).toHaveLength(1)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].password).toBe(hash)
    expect(hash).not.toBe(config.password)
  })

  it('refuses to change the email of an existing superadmin', async () => {
    const { client } = fakeClient()
    await seedSuperadmin(config, client)
    await expect(seedSuperadmin({ ...config, email: 'different@example.com' }, client))
      .rejects.toThrow('different email')
  })

  it('rejects example secrets', () => {
    expect(() => readBootstrapConfig({
      DATABASE_URL: config.databaseUrl,
      SUPERADMIN_EMAIL: config.email,
      SUPERADMIN_PASSWORD: 'replace-with-a-unique-strong-password',
      BETTER_AUTH_SECRET: 'replace-with-at-least-32-random-characters',
    })).toThrow('SUPERADMIN_PASSWORD')
  })
})
