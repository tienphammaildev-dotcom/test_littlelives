import { randomUUID } from 'node:crypto';
import {
  Invoice, InvoiceStatus, Payment, PaymentMethod, PaymentResult, PaymentStatus,
} from '../models.js';
import { PaymentError, ValidationError } from '../utils/errors.js';
import { fromCents, toCents } from '../utils/money.js';

function validatePayment(invoice: Invoice, amount: number, method: PaymentMethod): void {
  if (!invoice?.id) {
    throw new ValidationError('A valid invoice is required');
  }
  if (!Object.values(PaymentMethod).includes(method)) {
    throw new ValidationError(`Unsupported payment method: ${method}`);
  }
  if (toCents(amount, 'Payment amount') <= 0) {
    throw new ValidationError('Payment amount must be greater than zero');
  }
  if (invoice.status === InvoiceStatus.VOID) {
    throw new PaymentError('Cannot pay a void invoice');
  }
  if (invoice.outstandingAmount < 0) {
    throw new PaymentError('Invoice already has a negative balance');
  }
}

export function recordPayment(
  invoice: Invoice,
  amount: number,
  method: PaymentMethod,
  paymentId: string = randomUUID(),
  referenceNumber = `PAY-${Date.now()}`,
  paymentDate = new Date(),
): PaymentResult {
  validatePayment(invoice, amount, method);

  const amountCents = toCents(amount, 'Payment amount');
  const balanceCents = toCents(invoice.outstandingAmount, 'Invoice balance');
  const totalCents = toCents(invoice.totalAmount, 'Invoice total');

  const difference = balanceCents - amountCents;
  const overpaymentCents = Math.max(0, -difference);
  const newBalanceCents = Math.max(0, difference);

  let nextStatus: InvoiceStatus;
  if (overpaymentCents > 0) {
    nextStatus = InvoiceStatus.OVERPAID;
  } else if (newBalanceCents === 0) {
    nextStatus = InvoiceStatus.PAID;
  } else if (newBalanceCents < totalCents) {
    nextStatus = InvoiceStatus.PARTIALLY_PAID;
  } else {
    nextStatus = InvoiceStatus.ISSUED;
  }

  const payment: Payment = {
    id: paymentId,
    invoiceId: invoice.id,
    paymentMethod: method,
    amount,
    paymentDate,
    referenceNumber,
    status: PaymentStatus.COMPLETED,
  };

  return {
    payment,
    invoice: {
      ...invoice,
      outstandingAmount: fromCents(newBalanceCents),
      status: nextStatus,
    },
    overpayment: fromCents(overpaymentCents),
  };
}
