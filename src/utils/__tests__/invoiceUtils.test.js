import { describe, it, expect } from 'vitest'
import { calculateSubtotal, calculateTotal, generateInvoiceNumber } from '../invoiceUtils'

describe('invoiceUtils', () => {
  it('calculateSubtotal sums line items based on quantity and rate', () => {
    const items = [
      { qty: 1, rate: 100 },
      { qty: 2, rate: 25 }
    ]
    expect(calculateSubtotal(items)).toBe(150)
  })

  it('calculateSubtotal handles empty array and missing values gracefully', () => {
    expect(calculateSubtotal([])).toBe(0)
    expect(calculateSubtotal([{ qty: null, rate: 50 }, { qty: 2, rate: null }])).toBe(0)
  })

  it('calculateTotal calculates tax correctly when enabled', () => {
    expect(calculateTotal(100, 18, true)).toBe(118)
    expect(calculateTotal(200, 8.5, true)).toBe(217)
  })

  it('calculateTotal skips tax calculations when disabled', () => {
    expect(calculateTotal(100, 18, false)).toBe(100)
    expect(calculateTotal(200, 8.5, false)).toBe(200)
  })

  it('generateInvoiceNumber formats reference key as INV-YYYY-NNN', () => {
    const year = new Date().getFullYear()
    expect(generateInvoiceNumber(1)).toBe(`INV-${year}-001`)
    expect(generateInvoiceNumber(42)).toBe(`INV-${year}-042`)
    expect(generateInvoiceNumber(125)).toBe(`INV-${year}-125`)
  })
})
