import { describe, expect, it } from 'vitest';
import { Invoice, InvoiceStatus, PaymentMethod } from '../src/models.js';
import { recordPayment } from '../src/services/payment-service.js';

function makeInvoice(balance = 1000): Invoice {
  return {
    id: 'INV-1',
    invoiceNumber: 'INV-001',
    invoiceDate: new Date(),
    items: [],
    totalAmount: 1000,
    totalTax: 0,
    outstandingAmount: balance,
    status: InvoiceStatus.ISSUED,
  };
}

describe('recordPayment', () => {
  it('updates the balance for a partial payment', () => {
    const result = recordPayment(makeInvoice(), 300, PaymentMethod.CASH, 'P-1', 'REF-1');
    expect(result.invoice.outstandingAmount).toBe(700);
    expect(result.invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    expect(result.payment.status).toBe('completed');
  });

  it('marks the invoice as paid when the exact balance is received', () => {
    const result = recordPayment(makeInvoice(), 1000, PaymentMethod.BANK_TRANSFER);
    expect(result.invoice.outstandingAmount).toBe(0);
    expect(result.invoice.status).toBe(InvoiceStatus.PAID);
    expect(result.overpayment).toBe(0);
  });

  it('returns the extra amount when a payment is larger than the balance', () => {
    const result = recordPayment(makeInvoice(), 1050, PaymentMethod.BANK_TRANSFER);
    expect(result.invoice.outstandingAmount).toBe(0);
    expect(result.invoice.status).toBe(InvoiceStatus.OVERPAID);
    expect(result.overpayment).toBe(50);
  });

  it('rejects zero and negative payments', () => {
    expect(() => recordPayment(makeInvoice(), 0, PaymentMethod.CASH)).toThrow(/greater than zero/i);
    expect(() => recordPayment(makeInvoice(), -1, PaymentMethod.CASH)).toThrow(/negative/i);
  });

  it('does not allow payment for a void invoice', () => {
    expect(() => recordPayment(
      { ...makeInvoice(), status: InvoiceStatus.VOID },
      10,
      PaymentMethod.CASH,
    )).toThrow(/void invoice/i);
  });
});
