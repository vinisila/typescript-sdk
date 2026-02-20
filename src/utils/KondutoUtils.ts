import { KondutoModel } from '../models/KondutoModel';
import { KondutoPayment } from '../models/payments/KondutoPayment';
import { KondutoBoletoPayment } from '../models/payments/KondutoBoletoPayment';
import { KondutoCreditCardPayment } from '../models/payments/KondutoCreditCardPayment';
import { KondutoDebitPayment } from '../models/payments/KondutoDebitPayment';
import { KondutoTransferPayment } from '../models/payments/KondutoTransferPayment';
import { KondutoVoucherPayment } from '../models/payments/KondutoVoucherPayment';
import { KondutoPaymentType } from '../models/enums/KondutoPaymentType';

/**
 * Creates the appropriate KondutoPayment subclass instance based on the "type" field.
 */
export function createPayment(data: Record<string, unknown>): KondutoPayment {
  switch (data['type'] as KondutoPaymentType) {
    case KondutoPaymentType.boleto: {
      const p = new KondutoBoletoPayment();
      Object.assign(p, data);
      return p;
    }
    case KondutoPaymentType.credit: {
      const p = new KondutoCreditCardPayment();
      Object.assign(p, data);
      return p;
    }
    case KondutoPaymentType.debit: {
      const p = new KondutoDebitPayment();
      Object.assign(p, data);
      return p;
    }
    case KondutoPaymentType.transfer: {
      const p = new KondutoTransferPayment();
      Object.assign(p, data);
      return p;
    }
    case KondutoPaymentType.voucher: {
      const p = new KondutoVoucherPayment();
      Object.assign(p, data);
      return p;
    }
    default: {
      const p = new KondutoCreditCardPayment();
      Object.assign(p, data);
      return p;
    }
  }
}

/**
 * Deserializes a JSON string into a KondutoModel, handling polymorphic payment types.
 */
export function loadJson<T extends KondutoModel>(
  json: string,
  reviver?: (key: string, value: unknown) => unknown
): T {
  return JSON.parse(json, reviver) as T;
}

/**
 * Returns the first element of a JSON array string.
 */
export function getFirstJArrayElement(json: string): string {
  const arr = JSON.parse(json) as unknown[];
  return JSON.stringify(arr[0]);
}
