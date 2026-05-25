export function sanitizeSlug(val) {
  if (!val || !val.trim()) {
    throw new Error('Slug cannot be empty')
  }
  const sanitized = val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!sanitized) {
    throw new Error('Slug cannot be empty')
  }
  return sanitized
}

