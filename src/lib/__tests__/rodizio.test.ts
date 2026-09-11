import { describe, it, expect } from 'vitest'
import {
  getPlateLastDigit,
  getTodayRodizioInfo,
  isWithinTruckRodizioHours,
  isWithinGeneralRodizioHours,
  checkTruckRodizio,
} from '../rodizio'

describe('rodizio utility', () => {
  describe('getPlateLastDigit', () => {
    it('extracts last digit from legacy Brazilian plates', () => {
      expect(getPlateLastDigit('ABC-1234')).toBe(4)
      expect(getPlateLastDigit('XYZ-9870')).toBe(0)
      expect(getPlateLastDigit('kig-1011')).toBe(1)
    })

    it('extracts last digit from Mercosul plates (last char is always a digit)', () => {
      expect(getPlateLastDigit('ABC1D23')).toBe(3)
      expect(getPlateLastDigit('BRA2E19')).toBe(9)
      expect(getPlateLastDigit('XYZ9A00')).toBe(0)
      expect(getPlateLastDigit('FRO4L78')).toBe(8)
    })

    it('handles plates with extra spaces or lower case', () => {
      expect(getPlateLastDigit('  abc 1235  ')).toBe(5)
    })

    it('returns null for invalid or empty inputs', () => {
      expect(getPlateLastDigit('')).toBeNull()
      expect(getPlateLastDigit('ABCDEF')).toBeNull()
    })
  })

  describe('getTodayRodizioInfo', () => {
    it('returns correct restricted digits for each weekday', () => {
      // 2026-09-07 is Monday (Day 1)
      const monday = new Date(2026, 8, 7, 10, 0)
      expect(getTodayRodizioInfo(monday).restrictedDigits).toEqual([1, 2])
      expect(getTodayRodizioInfo(monday).dayName).toBe('Segunda-feira')

      // 2026-09-08 is Tuesday (Day 2)
      const tuesday = new Date(2026, 8, 8, 10, 0)
      expect(getTodayRodizioInfo(tuesday).restrictedDigits).toEqual([3, 4])

      // 2026-09-09 is Wednesday (Day 3)
      const wednesday = new Date(2026, 8, 9, 10, 0)
      expect(getTodayRodizioInfo(wednesday).restrictedDigits).toEqual([5, 6])

      // 2026-09-10 is Thursday (Day 4)
      const thursday = new Date(2026, 8, 10, 10, 0)
      expect(getTodayRodizioInfo(thursday).restrictedDigits).toEqual([7, 8])

      // 2026-09-11 is Friday (Day 5)
      const friday = new Date(2026, 8, 11, 10, 0)
      expect(getTodayRodizioInfo(friday).restrictedDigits).toEqual([9, 0])
    })

    it('returns empty restriction on weekends', () => {
      // 2026-09-12 is Saturday (Day 6)
      const saturday = new Date(2026, 8, 12, 10, 0)
      const satInfo = getTodayRodizioInfo(saturday)
      expect(satInfo.isWeekend).toBe(true)
      expect(satInfo.restrictedDigits).toEqual([])

      // 2026-09-13 is Sunday (Day 0)
      const sunday = new Date(2026, 8, 13, 10, 0)
      const sunInfo = getTodayRodizioInfo(sunday)
      expect(sunInfo.isWeekend).toBe(true)
      expect(sunInfo.restrictedDigits).toEqual([])
    })
  })

  describe('isWithinTruckRodizioHours', () => {
    it('returns true between 05:00 and 21:00 on weekdays', () => {
      const thursdayMorning = new Date(2026, 8, 10, 5, 0) // 05:00
      expect(isWithinTruckRodizioHours(thursdayMorning)).toBe(true)

      const thursdayAfternoon = new Date(2026, 8, 10, 14, 30) // 14:30
      expect(isWithinTruckRodizioHours(thursdayAfternoon)).toBe(true)

      const thursdayNight = new Date(2026, 8, 10, 20, 59) // 20:59
      expect(isWithinTruckRodizioHours(thursdayNight)).toBe(true)
    })

    it('returns false outside 05:00-21:00 on weekdays', () => {
      const thursdayDawn = new Date(2026, 8, 10, 4, 30) // 04:30
      expect(isWithinTruckRodizioHours(thursdayDawn)).toBe(false)

      const thursdayLate = new Date(2026, 8, 10, 21, 15) // 21:15
      expect(isWithinTruckRodizioHours(thursdayLate)).toBe(false)
    })

    it('returns false on weekends even during daytime', () => {
      const saturdayNoon = new Date(2026, 8, 12, 12, 0)
      expect(isWithinTruckRodizioHours(saturdayNoon)).toBe(false)
    })
  })

  describe('isWithinGeneralRodizioHours', () => {
    it('returns true during morning rush (07-10h) and evening rush (17-20h)', () => {
      const morningRush = new Date(2026, 8, 10, 8, 30)
      expect(isWithinGeneralRodizioHours(morningRush)).toBe(true)

      const eveningRush = new Date(2026, 8, 10, 18, 15)
      expect(isWithinGeneralRodizioHours(eveningRush)).toBe(true)
    })

    it('returns false between rush hours (e.g. 12:00)', () => {
      const lunchTime = new Date(2026, 8, 10, 12, 30)
      expect(isWithinGeneralRodizioHours(lunchTime)).toBe(false)
    })
  })

  describe('checkTruckRodizio', () => {
    it('identifies truck with rodízio on Thursday when plate ends with 7 or 8', () => {
      // 2026-09-10 is Thursday at 14:00
      const thursday14h = new Date(2026, 8, 10, 14, 0)

      const truck7 = checkTruckRodizio('ABC-1237', thursday14h)
      expect(truck7.lastDigit).toBe(7)
      expect(truck7.isRodizioToday).toBe(true)
      expect(truck7.isTruckRestrictedNow).toBe(true)
      expect(truck7.rodizioDayName).toBe('Quinta-feira')
      expect(truck7.warningMessage).toContain('está em horário e dia de rodízio')

      const truck8 = checkTruckRodizio('BRA2E18', thursday14h)
      expect(truck8.lastDigit).toBe(8)
      expect(truck8.isRodizioToday).toBe(true)
      expect(truck8.isTruckRestrictedNow).toBe(true)

      // Truck ending in 1 should not have rodízio on Thursday
      const truck1 = checkTruckRodizio('XYZ-9991', thursday14h)
      expect(truck1.lastDigit).toBe(1)
      expect(truck1.isRodizioToday).toBe(false)
      expect(truck1.isTruckRestrictedNow).toBe(false)
      expect(truck1.rodizioDayName).toBe('Segunda-feira')
    })
  })
})
