import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchInternetDate,
  getNetworkDate,
  formatToSaoPauloDatetimeInput,
  formatNetworkDateTime,
} from '../server-time'

describe('server-time service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatToSaoPauloDatetimeInput', () => {
    it('formats UTC date to America/Sao_Paulo local time string', () => {
      // 2026-09-11T12:30:00Z is 09:30 in America/Sao_Paulo (UTC-3)
      const fixedUtcDate = new Date('2026-09-11T12:30:00Z')
      const formatted = formatToSaoPauloDatetimeInput(fixedUtcDate)
      expect(formatted).toBe('2026-09-11T09:30')
    })
  })

  describe('formatNetworkDateTime', () => {
    it('formats date to pt-BR human format', () => {
      const fixedUtcDate = new Date('2026-09-11T12:30:00Z')
      const formatted = formatNetworkDateTime(fixedUtcDate)
      expect(formatted).toContain('11/09/2026')
      expect(formatted).toContain('09:30')
    })
  })

  describe('fetchInternetDate', () => {
    it('synchronizes time using Supabase Date header', async () => {
      const mockServerDate = 'Fri, 11 Sep 2026 12:00:00 GMT'
      const headers = new Headers()
      headers.set('date', mockServerDate)

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        headers,
      } as unknown as Response)

      const result = await fetchInternetDate()
      expect(result.source).toBe('supabase')
      expect(result.isNetworkVerified).toBe(true)
      expect(result.date.getFullYear()).toBe(2026)
    })

    it('falls back to cloudflare when supabase fails', async () => {
      // Supabase fails
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url).includes('cloudflare')) {
          return {
            text: async () => 'ts=1789128000.123\nother=data',
          } as unknown as Response
        }
        throw new Error('Supabase network down')
      })

      const result = await fetchInternetDate()
      expect(result.source).toBe('cloudflare')
      expect(result.isNetworkVerified).toBe(true)
    })

    it('falls back to device or cached offset when all network fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Complete offline'))

      const result = await fetchInternetDate()
      expect(result).toBeDefined()
      expect(result.date).toBeInstanceOf(Date)
    })
  })

  describe('getNetworkDate', () => {
    it('returns a valid Date object', () => {
      const d = getNetworkDate()
      expect(d).toBeInstanceOf(Date)
      expect(!isNaN(d.getTime())).toBe(true)
    })
  })
})
