import { KondutoPayment } from './KondutoPayment';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';

/**
 * Boleto payment model.
 * @see http://docs.konduto.com
 */
export class KondutoBoletoPayment extends KondutoPayment {
  /** Expiration date in YYYY-MM-DD format. */
  expiration_date?: string;

  constructor() {
    super(KondutoPaymentType.boleto);
  }
}
