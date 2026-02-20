import { KondutoPayment } from './KondutoPayment';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';

/**
 * Debit payment model.
 * @see http://docs.konduto.com
 */
export class KondutoDebitPayment extends KondutoPayment {
  constructor() {
    super(KondutoPaymentType.debit);
  }
}
