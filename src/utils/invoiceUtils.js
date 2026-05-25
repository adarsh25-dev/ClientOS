export function calculateSubtotal(lineItems) {
  return (lineItems || []).reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0)
}

export function calculateTotal(subtotal, taxRate, taxEnabled) {
  const tax = taxEnabled ? subtotal * ((taxRate || 0) / 100) : 0
  return subtotal + tax
}

export function generateInvoiceNumber(count) {
  const year = new Date().getFullYear()
  const padCount = String(count).padStart(3, '0')
  return `INV-${year}-${padCount}`
}
