import { describe, expect, it } from 'vitest';
import { calculateInvoice } from '../src/services/invoice-service.js';
import { InvoiceItem } from '../src/models.js';

function makeItem(id: string, quantity: number, unitPrice: number): InvoiceItem {
  return {
    id,
    description: id,
    quantity,
    unitPrice,
    lineTotal: 0,
    taxRate: 0.07,
    taxAmount: 0,
  };
}

describe('calculateInvoice', () => {
  it('calculates subtotal, tax, and total', () => {
    const result = calculateInvoice([
      makeItem('MONTHLY', 1, 500),
      makeItem('ACTIVITY', 2, 25.5),
    ], 0.07);

    expect(result).toEqual({ subtotal: 551, tax: 38.57, total: 589.57 });
  });

  it('allows a free item', () => {
    expect(calculateInvoice([makeItem('FREE', 1, 0)], 0.07))
      .toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it('rejects an empty invoice', () => {
    expect(() => calculateInvoice([], 0.07)).toThrow(/at least one item/i);
  });

  it('rejects invalid quantity and price', () => {
    expect(() => calculateInvoice([makeItem('BAD-QTY', 0, 10)], 0.07)).toThrow(/quantity/i);
    expect(() => calculateInvoice([makeItem('BAD-PRICE', 1, -10)], 0.07)).toThrow(/price/i);
  });

  it('rejects duplicate item ids', () => {
    expect(() => calculateInvoice([
      makeItem('DUPLICATE', 1, 10),
      makeItem('DUPLICATE', 1, 20),
    ], 0.07)).toThrow(/duplicate/i);
  });

  it('handles decimal prices without common floating-point errors', () => {
    expect(calculateInvoice([makeItem('DECIMAL', 3, 0.1)], 0).total).toBe(0.3);
  });
});
