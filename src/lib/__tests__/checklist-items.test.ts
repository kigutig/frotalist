import { describe, it, expect } from 'vitest'
import {
  DEPARTURE_CHECKLIST_ITEMS,
  RETURN_CHECKLIST_ITEMS,
  CATEGORY_LABELS,
} from '../checklist-items'

describe('DEPARTURE_CHECKLIST_ITEMS', () => {
  it('has at least 30 items', () => {
    expect(DEPARTURE_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(30)
  })

  it('every item has required fields', () => {
    DEPARTURE_CHECKLIST_ITEMS.forEach((item) => {
      expect(item.key, `item "${item.key}" must have a key`).toBeTruthy()
      expect(item.label, `item "${item.key}" must have a label`).toBeTruthy()
      expect(item.category, `item "${item.key}" must have a category`).toBeTruthy()
      expect(typeof item.is_required).toBe('boolean')
      expect(typeof item.is_quick).toBe('boolean')
      expect(typeof item.blocks_release).toBe('boolean')
    })
  })

  it('has no duplicate keys', () => {
    const keys = DEPARTURE_CHECKLIST_ITEMS.map((i) => i.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('all categories exist in CATEGORY_LABELS', () => {
    const uniqueCategories = [...new Set(DEPARTURE_CHECKLIST_ITEMS.map((i) => i.category))]
    uniqueCategories.forEach((cat) => {
      expect(CATEGORY_LABELS, `category "${cat}" must be in CATEGORY_LABELS`).toHaveProperty(cat)
    })
  })

  it('has at least one "blocks_release" item', () => {
    const blocking = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.blocks_release)
    expect(blocking.length).toBeGreaterThan(0)
  })

  it('has documentation category', () => {
    const docItems = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.category === 'documentation')
    expect(docItems.length).toBeGreaterThan(0)
  })

  it('has safety category', () => {
    const safetyItems = DEPARTURE_CHECKLIST_ITEMS.filter((i) => i.category === 'safety')
    expect(safetyItems.length).toBeGreaterThan(0)
  })
})

describe('RETURN_CHECKLIST_ITEMS', () => {
  it('has at least 15 items', () => {
    expect(RETURN_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(15)
  })

  it('every item has required fields', () => {
    RETURN_CHECKLIST_ITEMS.forEach((item) => {
      expect(item.key, `item "${item.key}" must have a key`).toBeTruthy()
      expect(item.label, `item "${item.key}" must have a label`).toBeTruthy()
      expect(item.category, `item "${item.key}" must have a category`).toBeTruthy()
    })
  })

  it('has no duplicate keys', () => {
    const keys = RETURN_CHECKLIST_ITEMS.map((i) => i.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('no key overlap between departure and return', () => {
    const departurKeys = new Set(DEPARTURE_CHECKLIST_ITEMS.map((i) => i.key))
    const overlap = RETURN_CHECKLIST_ITEMS.filter((i) => departurKeys.has(i.key))
    expect(overlap).toHaveLength(0)
  })

  it('all return categories start with return_', () => {
    const categories = [...new Set(RETURN_CHECKLIST_ITEMS.map((i) => i.category))]
    categories.forEach((cat) => {
      expect(cat.startsWith('return_')).toBe(true)
    })
  })
})

describe('CATEGORY_LABELS', () => {
  it('has all departure categories', () => {
    const expected = ['documentation', 'exterior', 'interior', 'safety', 'cargo']
    expected.forEach((cat) => {
      expect(CATEGORY_LABELS).toHaveProperty(cat)
      expect(CATEGORY_LABELS[cat]).toBeTruthy()
    })
  })

  it('has all return categories', () => {
    const expected = ['return_vehicle', 'return_interior', 'return_cargo']
    expected.forEach((cat) => {
      expect(CATEGORY_LABELS).toHaveProperty(cat)
      expect(CATEGORY_LABELS[cat]).toBeTruthy()
    })
  })

  it('all label values are non-empty strings', () => {
    Object.entries(CATEGORY_LABELS).forEach(([key, value]) => {
      expect(typeof value, `label for "${key}" must be a string`).toBe('string')
      expect(value.length, `label for "${key}" must not be empty`).toBeGreaterThan(0)
    })
  })
})
