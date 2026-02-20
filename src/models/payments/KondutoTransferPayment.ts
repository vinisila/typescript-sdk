import { KondutoPayment } from './KondutoPayment';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';

/**
 * Transfer payment model.
 * @see http://docs.konduto.com
 */
export class KondutoTransferPayment extends KondutoPayment {
  constructor() {
    super(KondutoPaymentType.transfer);
  }
}
