import { KondutoModel } from '../KondutoModel';
import { KondutoPaymentType } from '../enums/KondutoPaymentType';

/**
 * Abstract payment model.
 * @see http://docs.konduto.com
 */
export abstract class KondutoPayment extends KondutoModel {
  type: KondutoPaymentType;
  amount?: number;
  description?: string;

  protected constructor(type: KondutoPaymentType) {
    super();
    this.type = type;
  }
}
