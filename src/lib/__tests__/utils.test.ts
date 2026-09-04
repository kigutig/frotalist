import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatMileage,
  formatCurrency,
  formatCPF,
  formatPhone,
  daysUntil,
  isCNHExpired,
  isCNHExpiring,
  getInitials,
  truncate,
  generateId,
  cn,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
  TRIP_STATUS_LABELS,
  TRIP_STATUS_COLORS,
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_COLORS,
  CHECKLIST_STATUS_LABELS,
  MAINTENANCE_STATUS_LABELS,
  sanitizeImageUrl,
} from '../utils'

// ---- formatDate ----
describe('formatDate', () => {
  it('formats a valid ISO date string to dd/MM/yyyy', () => {
    expect(formatDate('2025-01-15')).toBe('15/01/2025')
  })

  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns "—" for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('handles full ISO datetime string', () => {
    expect(formatDate('2025-12-31T23:59:59Z')).toBe('31/12/2025')
  })
})

// ---- formatDateTime ----
describe('formatDateTime', () => {
  it('formats a valid ISO datetime', () => {
    const result = formatDateTime('2025-06-20T14:30:00')
    expect(result).toContain('20/06/2025')
    expect(result).toContain('14:30')
  })

  it('returns "—" for null', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })
})

// ---- formatMileage ----
describe('formatMileage', () => {
  it('formats a number with "km" suffix', () => {
    expect(formatMileage(150000)).toContain('km')
    expect(formatMileage(150000)).toContain('150')
  })

  it('returns "—" for null', () => {
    expect(formatMileage(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatMileage(undefined)).toBe('—')
  })

  it('formats zero', () => {
    expect(formatMileage(0)).toContain('0')
  })
})

// ---- formatCurrency ----
describe('formatCurrency', () => {
  it('formats a value as BRL currency', () => {
    const result = formatCurrency(1500.5)
    expect(result).toContain('1.500')
    expect(result).toContain('R$')
  })

  it('returns "—" for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })
})

// ---- formatCPF ----
describe('formatCPF', () => {
  it('formats an 11-digit CPF string', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })

  it('handles already-formatted CPF', () => {
    // strips non-digits first, then re-formats
    expect(formatCPF('123.456.789-01')).toBe('123.456.789-01')
  })
})

// ---- formatPhone ----
describe('formatPhone', () => {
  it('formats an 11-digit mobile number', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formats a 10-digit landline number', () => {
    expect(formatPhone('1132324455')).toContain('(11)')
  })
})

// ---- daysUntil ----
describe('daysUntil', () => {
  it('returns null for null input', () => {
    expect(daysUntil(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(daysUntil(undefined)).toBeNull()
  })

  it('returns a positive number for a future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const result = daysUntil(future.toISOString().slice(0, 10))
    expect(result).toBeGreaterThanOrEqual(9)
    expect(result).toBeLessThanOrEqual(10)
  })

  it('returns a negative number for a past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    const result = daysUntil(past.toISOString().slice(0, 10))
    expect(result).toBeLessThan(0)
  })

  it('returns 0 for today', () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = daysUntil(today)
    expect(result).toBe(0)
  })
})

// ---- isCNHExpired ----
describe('isCNHExpired', () => {
  it('returns true for a past date', () => {
    const past = new Date()
    past.setFullYear(past.getFullYear() - 1)
    expect(isCNHExpired(past.toISOString().slice(0, 10))).toBe(true)
  })

  it('returns false for a future date', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(isCNHExpired(future.toISOString().slice(0, 10))).toBe(false)
  })
})

// ---- isCNHExpiring ----
describe('isCNHExpiring', () => {
  it('returns true when expiring within threshold', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    expect(isCNHExpiring(soon.toISOString().slice(0, 10), 60)).toBe(true)
  })

  it('returns false when expiring beyond threshold', () => {
    const far = new Date()
    far.setDate(far.getDate() + 90)
    expect(isCNHExpiring(far.toISOString().slice(0, 10), 60)).toBe(false)
  })

  it('returns false when already expired', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isCNHExpiring(past.toISOString().slice(0, 10), 60)).toBe(false)
  })
})

// ---- getInitials ----
describe('getInitials', () => {
  it('returns first two initials from a full name', () => {
    expect(getInitials('João Silva')).toBe('JS')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('Maria')).toBe('M')
  })

  it('handles extra spaces', () => {
    expect(getInitials('  João   Silva  ')).toBe('JS')
  })

  it('returns uppercase', () => {
    expect(getInitials('pedro alves')).toBe('PA')
  })
})

// ---- truncate ----
describe('truncate', () => {
  it('truncates long string with ellipsis', () => {
    const long = 'A'.repeat(60)
    const result = truncate(long, 50)
    expect(result.endsWith('...')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(53)
  })

  it('does not truncate short strings', () => {
    expect(truncate('short', 50)).toBe('short')
  })

  it('uses default maxLength of 50', () => {
    const exactly50 = 'A'.repeat(50)
    expect(truncate(exactly50)).toBe(exactly50)
  })
})

// ---- generateId ----
describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ---- cn (classnames merge) ----
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toContain('bg-blue-500')
    expect(result).not.toContain('bg-red-500')
  })

  it('handles conditional classes', () => {
    const isHidden = false
    expect(cn('base', isHidden && 'hidden', 'visible')).toBe('base visible')
  })
})

// ---- Status labels completeness ----
describe('Status label maps', () => {
  it('DRIVER_STATUS_LABELS covers all statuses', () => {
    expect(DRIVER_STATUS_LABELS).toHaveProperty('active')
    expect(DRIVER_STATUS_LABELS).toHaveProperty('inactive')
    expect(DRIVER_STATUS_LABELS).toHaveProperty('blocked')
  })

  it('DRIVER_STATUS_COLORS has dot and badge for each status', () => {
    Object.values(DRIVER_STATUS_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty('dot')
      expect(colors).toHaveProperty('badge')
    })
  })

  it('TRIP_STATUS_LABELS covers all statuses', () => {
    const expected = ['planned', 'released', 'in_route', 'returned', 'cancelled']
    expected.forEach((s) => expect(TRIP_STATUS_LABELS).toHaveProperty(s))
  })

  it('TRIP_STATUS_COLORS has an entry for each trip status', () => {
    const expected = ['planned', 'released', 'in_route', 'returned', 'cancelled']
    expected.forEach((s) => expect(TRIP_STATUS_COLORS).toHaveProperty(s))
  })

  it('TRUCK_STATUS_LABELS covers all statuses', () => {
    const expected = ['available', 'in_route', 'maintenance', 'blocked', 'inactive']
    expected.forEach((s) => expect(TRUCK_STATUS_LABELS).toHaveProperty(s))
  })

  it('TRUCK_STATUS_COLORS has dot and badge for each status', () => {
    Object.values(TRUCK_STATUS_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty('dot')
      expect(colors).toHaveProperty('badge')
    })
  })

  it('OCCURRENCE_SEVERITY_LABELS covers all severities', () => {
    const expected = ['low', 'medium', 'high', 'critical']
    expected.forEach((s) => expect(OCCURRENCE_SEVERITY_LABELS).toHaveProperty(s))
  })

  it('OCCURRENCE_SEVERITY_COLORS has badge and dot for each severity', () => {
    Object.values(OCCURRENCE_SEVERITY_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty('badge')
      expect(colors).toHaveProperty('dot')
    })
  })

  it('CHECKLIST_STATUS_LABELS covers all statuses', () => {
    const expected = ['draft', 'in_progress', 'completed', 'approved', 'rejected', 'released']
    expected.forEach((s) => expect(CHECKLIST_STATUS_LABELS).toHaveProperty(s))
  })

  it('MAINTENANCE_STATUS_LABELS covers all statuses', () => {
    const expected = ['scheduled', 'in_progress', 'completed']
    expected.forEach((s) => expect(MAINTENANCE_STATUS_LABELS).toHaveProperty(s))
  })
})

// ---- sanitizeImageUrl ----
describe('sanitizeImageUrl', () => {
  it('allows valid https and http URLs', () => {
    expect(sanitizeImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
    expect(sanitizeImageUrl('http://example.com/photo.jpg')).toBe('http://example.com/photo.jpg')
  })

  it('allows blob and data:image URLs', () => {
    expect(sanitizeImageUrl('blob:http://localhost/uuid-123')).toBe('blob:http://localhost/uuid-123')
    expect(sanitizeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=')
  })

  it('blocks javascript: and other unsafe protocols', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    expect(sanitizeImageUrl('vbscript:msgbox(1)')).toBe('')
  })

  it('returns empty string for null, undefined or empty input', () => {
    expect(sanitizeImageUrl(null)).toBe('')
    expect(sanitizeImageUrl(undefined)).toBe('')
    expect(sanitizeImageUrl('')).toBe('')
    expect(sanitizeImageUrl('   ')).toBe('')
  })
})
