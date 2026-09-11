import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateRouteDistanceAndETA,
  formatDurationMinutes,
  formatEstimatedArrival,
  FIXED_DEPARTURE_ORIGIN,
} from '../route-calculator'

describe('route-calculator', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatDurationMinutes', () => {
    it('formats minutes under 1 hour', () => {
      expect(formatDurationMinutes(45)).toBe('45min')
      expect(formatDurationMinutes(0)).toBe('0min')
    })

    it('formats exact hours', () => {
      expect(formatDurationMinutes(60)).toBe('1h')
      expect(formatDurationMinutes(120)).toBe('2h')
    })

    it('formats hours and minutes', () => {
      expect(formatDurationMinutes(95)).toBe('1h 35min')
      expect(formatDurationMinutes(310)).toBe('5h 10min')
    })
  })

  describe('formatEstimatedArrival', () => {
    it('formats arrival date to pt-BR string with date and time', () => {
      const fixedDate = new Date(2026, 8, 10, 15, 30) // 10/09/2026 15:30
      const formatted = formatEstimatedArrival(fixedDate)
      expect(formatted).toContain('15:30')
    })
  })

  describe('calculateRouteDistanceAndETA fallback offline engine', () => {
    it('calculates route between known Brazilian hubs when network fails', async () => {
      // Mock fetch to simulate network error or offline mode
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

      const result = await calculateRouteDistanceAndETA(
        'São Paulo',
        'Campinas',
        new Date(2026, 8, 10, 8, 0),
        3.5
      )

      expect(result).not.toBeNull()
      // São Paulo -> Campinas is around 90-110 km
      expect(result.distanceKm).toBeGreaterThan(60)
      expect(result.distanceKm).toBeLessThan(150)
      expect(result.durationMinutes).toBeGreaterThan(50)
      expect(result.source).toBe('fallback')
      expect(result.insights.length).toBeGreaterThan(0)
    })

    it('calculates rest stops according to Lei do Motorista for long routes', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'))

      // SP to Salvador (~1900 km road)
      const result = await calculateRouteDistanceAndETA(
        'São Paulo',
        'Salvador',
        new Date(2026, 8, 10, 6, 0),
        3.5
      )

      expect(result).not.toBeNull()
      expect(result.distanceKm).toBeGreaterThan(1200)
      // For > 1200 km at truck speed (~70 km/h), duration > 17h, rest stops >= 3
      expect(result.restStops).toBeGreaterThanOrEqual(3)
      expect(result.fuelEstimateLiters).toBeDefined()
      expect(result.fuelEstimateLiters).toBeGreaterThan(200)
    })

    it('calculates route from the fixed Cotia warehouse origin by default', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'))

      const result = await calculateRouteDistanceAndETA(
        FIXED_DEPARTURE_ORIGIN,
        'São Paulo'
      )

      expect(result).not.toBeNull()
      // Cotia to São Paulo is around 30-45 km
      expect(result.distanceKm).toBeGreaterThanOrEqual(15)
      expect(result.distanceKm).toBeLessThan(70)
      expect(result.originFormatted).toContain('Cotia')
    })

    it('throws error if destination is empty', async () => {
      await expect(calculateRouteDistanceAndETA(undefined, '   ')).rejects.toThrow(
        'Informe o destino'
      )
    })
  })
})
