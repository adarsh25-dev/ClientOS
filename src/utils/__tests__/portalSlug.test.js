import { describe, it, expect } from 'vitest'
import { sanitizeSlug } from '../portalSlug'

describe('portalSlug utils', () => {
  it('sanitizeSlug converts to lowercase and replaces spaces with hyphens', () => {
    expect(sanitizeSlug('Adarsh Parmar Design')).toBe('adarsh-parmar-design')
  })

  it('sanitizeSlug strips special characters', () => {
    expect(sanitizeSlug('My Agency!!')).toBe('my-agency')
    expect(sanitizeSlug('hello@world 123!')).toBe('helloworld-123')
  })

  it('sanitizeSlug handles redundant hyphens and spacing', () => {
    expect(sanitizeSlug('  Some - - Spaces  ')).toBe('some-spaces')
  })

  it('sanitizeSlug throws error for empty inputs', () => {
    expect(() => sanitizeSlug('')).toThrow('Slug cannot be empty')
  })
})
