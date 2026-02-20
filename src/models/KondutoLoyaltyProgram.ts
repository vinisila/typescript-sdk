import { KondutoModel } from './KondutoModel';

/**
 * Loyalty program model.
 * @see http://docs.konduto.com
 */
export class KondutoLoyaltyProgram extends KondutoModel {
  program?: string;
  category?: string;
}
