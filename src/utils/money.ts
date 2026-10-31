import { ValidationError } from './errors.js';

export function toCents(amount: number, field = 'amount'): number {
  if (!Number.isFinite(amount)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  if (amount < 0) {
    throw new ValidationError(`${field} must not be negative`);
  }

  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new ValidationError(`${field} is outside the supported range`);
  }
  return cents;
}

export function fromCents(cents: number): number {
  if (!Number.isSafeInteger(cents)) {
    throw new ValidationError('Money value is outside the supported range');
  }
  return Number((cents / 100).toFixed(2));
}
