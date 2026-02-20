import { KondutoPayment } from './KondutoPayment';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';

/**
 * Voucher payment model.
 * @see http://docs.konduto.com
 */
export class KondutoVoucherPayment extends KondutoPayment {
  constructor() {
    super(KondutoPaymentType.voucher);
  }
}
