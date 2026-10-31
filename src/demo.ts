import { Invoice, InvoiceStatus, PaymentMethod } from './models.js';
import { calculateInvoice } from './services/invoice-service.js';
import { recordPayment } from './services/payment-service.js';
import { createReceipt } from './services/receipt-service.js';

const items = [
  {
    id: 'ITEM-1',
    description: 'Monthly Fee',
    quantity: 1,
    unitPrice: 500,
    lineTotal: 500,
    taxRate: 0.07,
    taxAmount: 35,
  },
  {
    id: 'ITEM-2',
    description: 'Activity Fee',
    quantity: 2,
    unitPrice: 25.5,
    lineTotal: 51,
    taxRate: 0.07,
    taxAmount: 3.57,
  },
];

const totals = calculateInvoice(items, 0.07);

const invoice: Invoice = {
  id: 'INV-1',
  invoiceNumber: '2026-0001',
  invoiceDate: new Date(),
  items,
  totalAmount: totals.total,
  totalTax: totals.tax,
  outstandingAmount: totals.total,
  status: InvoiceStatus.ISSUED,
};

const paymentResult = recordPayment(invoice, 300, PaymentMethod.CASH, 'PAY-1', 'CASH-001');
const receipt = createReceipt(paymentResult.payment, paymentResult.invoice, 'RCT-1', 'RCT-0001');

console.log({ totals, payment: paymentResult.payment, invoice: paymentResult.invoice, receipt });
