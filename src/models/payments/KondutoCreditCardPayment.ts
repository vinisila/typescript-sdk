import { KondutoPayment } from './KondutoPayment';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';
import { KondutoCreditCardPaymentStatus } from '../enums/KondutoCreditCardPaymentStatus';

/**
 * Credit card payment model.
 * @see http://docs.konduto.com
 */
export class KondutoCreditCardPayment extends KondutoPayment {
  /** First 6 digits of the card number. */
  bin?: string;
  /** Last 4 digits of the card number. */
  last4?: string;
  /** Expiration date in MMYYYY format. */
  expiration_date?: string;
  status?: KondutoCreditCardPaymentStatus;

  constructor() {
    super(KondutoPaymentType.credit);
  }
}
