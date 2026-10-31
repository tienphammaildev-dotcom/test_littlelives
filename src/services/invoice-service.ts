import { InvoiceItem, InvoiceTotals } from '../models.js';
import { ValidationError } from '../utils/errors.js';
import { fromCents, toCents } from '../utils/money.js';

function validateItems(items: InvoiceItem[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('An invoice must have at least one item');
  }

  const itemIds = new Set<string>();

  for (const item of items) {
    if (!item.id.trim()) {
      throw new ValidationError('Invoice item id is required');
    }
    if (itemIds.has(item.id)) {
      throw new ValidationError(`Duplicate invoice item id: ${item.id}`);
    }
    itemIds.add(item.id);

    if (!item.description.trim()) {
      throw new ValidationError(`Description is required for item ${item.id}`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new ValidationError(`Quantity for item ${item.id} must be greater than zero`);
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new ValidationError(`Unit price for item ${item.id} cannot be negative`);
    }
    if (!Number.isFinite(item.taxRate) || item.taxRate < 0 || item.taxRate > 1) {
      throw new ValidationError(`Tax rate for item ${item.id} must be between 0 and 1`);
    }
  }
}

export function calculateInvoice(items: InvoiceItem[], taxRate: number): InvoiceTotals {
  validateItems(items);

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new ValidationError('Tax rate must be between 0 and 1');
  }

  let subtotalCents = 0;
  let taxCents = 0;

  for (const item of items) {
    const unitPriceCents = toCents(item.unitPrice, `Unit price for ${item.id}`);
    const lineTotalCents = Math.round(item.quantity * unitPriceCents);

    if (!Number.isSafeInteger(lineTotalCents)) {
      throw new ValidationError(`Line total for item ${item.id} is too large`);
    }

    subtotalCents += lineTotalCents;
    taxCents += Math.round(lineTotalCents * taxRate);
  }

  return {
    subtotal: fromCents(subtotalCents),
    tax: fromCents(taxCents),
    total: fromCents(subtotalCents + taxCents),
  };
}
