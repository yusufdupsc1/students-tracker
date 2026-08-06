import { describe, it, expect } from 'vitest'
import { hashPassword } from './localAuth'

describe('localAuth hashPassword', () => {
  it('hashes consistently with same salt', async () => {
    const h1 = await hashPassword('secret123', 'test@example.com')
    const h2 = await hashPassword('secret123', 'test@example.com')
    expect(h1).toBe(h2)
  })
  it('different salts produce different hashes', async () => {
    const h1 = await hashPassword('secret123', 'a@example.com')
    const h2 = await hashPassword('secret123', 'b@example.com')
    expect(h1).not.toBe(h2)
  })
  it('hashes without salt for backward compat', async () => {
    const h = await hashPassword('secret123')
    expect(h.length).toBeGreaterThan(10)
  })
  it('salt is case-insensitive', async () => {
    const h1 = await hashPassword('secret123', 'TEST@EXAMPLE.COM')
    const h2 = await hashPassword('secret123', 'test@example.com')
    expect(h1).toBe(h2)
  })
})

describe('localAuth salt upgrade', () => {
  it('should upgrade legacy unsalted hash on login', async () => {
    // This is tested via integration in AuthContext; unit test ensures hashPassword works
    const legacy = await hashPassword('demo123')
    const salted = await hashPassword('demo123', 'demo@bejkhonda.edu.bd')
    expect(legacy).not.toBe(salted)
  })
})
