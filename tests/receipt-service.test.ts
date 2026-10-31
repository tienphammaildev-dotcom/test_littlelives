import { describe, expect, it } from 'vitest';
import {
  Invoice, InvoiceStatus, Payment, PaymentMethod, PaymentStatus,
} from '../src/models.js';
import { createReceipt } from '../src/services/receipt-service.js';

const invoice: Invoice = {
  id: 'INV-1',
  invoiceNumber: 'INV-001',
  invoiceDate: new Date(),
  items: [
    { id: 'ITEM-1', description: 'First', quantity: 1, unitPrice: 50, lineTotal: 50, taxRate: 0, taxAmount: 0 },
    { id: 'ITEM-2', description: 'Second', quantity: 1, unitPrice: 100, lineTotal: 100, taxRate: 0, taxAmount: 0 },
  ],
  totalAmount: 150,
  totalTax: 0,
  outstandingAmount: 50,
  status: InvoiceStatus.PARTIALLY_PAID,
};

const payment: Payment = {
  id: 'PAY-1',
  invoiceId: 'INV-1',
  paymentMethod: PaymentMethod.CASH,
  amount: 100,
  paymentDate: new Date(),
  referenceNumber: 'REF-1',
  status: PaymentStatus.COMPLETED,
};

describe('createReceipt', () => {
  it('allocates payment across invoice items in order', () => {
    const receipt = createReceipt(payment, invoice, 'REC-1', 'RCT-1');

    expect(receipt.totalPaid).toBe(100);
    expect(receipt.remainingBalance).toBe(50);
    expect(receipt.items).toEqual([
      { invoiceItemId: 'ITEM-1', amount: 50 },
      { invoiceItemId: 'ITEM-2', amount: 50 },
    ]);
  });

  it('rejects a payment for a different invoice', () => {
    expect(() => createReceipt({ ...payment, invoiceId: 'OTHER' }, invoice))
      .toThrow(/does not belong/i);
  });

  it('rejects a payment that has not completed', () => {
    expect(() => createReceipt({ ...payment, status: PaymentStatus.FAILED }, invoice))
      .toThrow(/completed/i);
  });
});
