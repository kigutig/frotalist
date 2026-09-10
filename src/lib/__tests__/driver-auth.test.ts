import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hashDriverPassword,
  verifyDriverPassword,
  hasDriverPassword,
  saveDriverPassword,
  clearDriverPassword,
  getDriverPasswordHash,
} from '../driver-auth'
import type { Driver } from '../../types'

vi.mock('../api', () => ({
  driversApi: {
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
}))

describe('driver-auth utility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('hashes a password using SHA-256 hex string', async () => {
    const hash1 = await hashDriverPassword('1234')
    const hash2 = await hashDriverPassword('1234')
    const hashOther = await hashDriverPassword('9999')

    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64)
    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hashOther)
  })

  it('identifies if a driver has password configured', async () => {
    const driverWithoutPwd: Driver = {
      id: 'd-1',
      name: 'Motorista 1',
      cpf: '111',
      phone: '222',
      cnh: '333',
      cnh_category: 'D',
      cnh_expiration: '2027-01-01',
      status: 'active',
      created_at: new Date().toISOString(),
    }

    expect(hasDriverPassword(driverWithoutPwd)).toBe(false)

    const hash = await hashDriverPassword('secret123')
    const driverWithPwd: Driver = {
      ...driverWithoutPwd,
      password_hash: hash,
    }

    expect(hasDriverPassword(driverWithPwd)).toBe(true)
    expect(getDriverPasswordHash(driverWithPwd)).toBe(hash)
  })

  it('verifies correct and incorrect passwords', async () => {
    const hash = await hashDriverPassword('meupin2026')
    const driver: Driver = {
      id: 'd-2',
      name: 'Ana Motorista',
      cpf: '222',
      phone: '333',
      cnh: '444',
      cnh_category: 'E',
      cnh_expiration: '2028-01-01',
      status: 'active',
      password_hash: hash,
      created_at: new Date().toISOString(),
    }

    const isValid = await verifyDriverPassword(driver, 'meupin2026')
    const isInvalid = await verifyDriverPassword(driver, 'senhaerrada')

    expect(isValid).toBe(true)
    expect(isInvalid).toBe(false)
  })

  it('saves password to localStorage and calls API update', async () => {
    const res = await saveDriverPassword('d-3', 'novasenha')

    expect(res.success).toBe(true)
    expect(res.hash.length).toBe(64)
    expect(localStorage.getItem('driver_pwd_hash_d-3')).toBe(res.hash)
  })

  it('clears driver password from localStorage and resets via API', async () => {
    localStorage.setItem('driver_pwd_hash_d-4', 'somehash')
    const res = await clearDriverPassword('d-4')

    expect(res.success).toBe(true)
    expect(localStorage.getItem('driver_pwd_hash_d-4')).toBeNull()
  })
})
