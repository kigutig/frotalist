import { describe, it, expect } from 'vitest'
import { fileToOptimizedDataUrl, isPersistentImageUrl } from '../image-utils'

describe('image-utils', () => {
  describe('isPersistentImageUrl', () => {
    it('returns false for blob: URLs', () => {
      expect(isPersistentImageUrl('blob:https://frotalist.vercel.app/7955d423-7af8-4f7b')).toBe(false)
      expect(isPersistentImageUrl('blob:http://localhost:5173/abc')).toBe(false)
    })

    it('returns false for empty or null URLs', () => {
      expect(isPersistentImageUrl('')).toBe(false)
      expect(isPersistentImageUrl(null)).toBe(false)
      expect(isPersistentImageUrl(undefined)).toBe(false)
    })

    it('returns true for data:image/ URLs and https:// URLs', () => {
      expect(isPersistentImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true)
      expect(isPersistentImageUrl('https://example.com/photo.jpg')).toBe(true)
      expect(isPersistentImageUrl('http://example.com/photo.png')).toBe(true)
    })
  })

  describe('fileToOptimizedDataUrl', () => {
    it('converts file to data url', async () => {
      const file = new File(['mock-image-content'], 'test.jpg', { type: 'image/jpeg' })
      const dataUrl = await fileToOptimizedDataUrl(file)
      expect(dataUrl).toContain('data:image/')
    })
  })
})
