import { randomUUID } from 'node:crypto';
import { Invoice, Payment, PaymentStatus, Receipt, ReceiptItem } from '../models.js';
import { ValidationError } from '../utils/errors.js';
import { fromCents, toCents } from '../utils/money.js';

export function createReceipt(
  payment: Payment,
  invoice: Invoice,
  receiptId: string = randomUUID(),
  receiptNumber = `RCT-${Date.now()}`,
  receiptDate = new Date(),
): Receipt {
  if (payment.invoiceId !== invoice.id) {
    throw new ValidationError('Payment does not belong to this invoice');
  }
  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new ValidationError('Only completed payments can have a receipt');
  }

  const paymentCents = toCents(payment.amount, 'Payment amount');
  const invoiceCents = toCents(invoice.totalAmount, 'Invoice total');
  let amountLeft = Math.min(paymentCents, invoiceCents);
  const receiptItems: ReceiptItem[] = [];

  for (const item of invoice.items) {
    if (amountLeft <= 0) break;

    const itemCents = toCents(item.lineTotal + item.taxAmount, `Item ${item.id} total`);
    const allocated = Math.min(itemCents, amountLeft);

    if (allocated > 0) {
      receiptItems.push({
        invoiceItemId: item.id,
        amount: fromCents(allocated),
      });
      amountLeft -= allocated;
    }
  }

  return {
    id: receiptId,
    paymentId: payment.id,
    receiptNumber,
    receiptDate,
    totalPaid: payment.amount,
    remainingBalance: invoice.outstandingAmount,
    items: receiptItems,
  };
}
