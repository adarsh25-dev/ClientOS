export function hexToRgb(hex) {
  if (!hex) return '201 168 76' // Default to #c9a84c (201, 168, 76)
  let c = hex.substring(1)
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('')
  }
  const num = parseInt(c, 16)
  if (isNaN(num)) return '201 168 76'
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`
}
