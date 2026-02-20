import { KondutoModel } from './KondutoModel';

/**
 * Seller model.
 * @see http://docs.konduto.com
 */
export class KondutoSeller extends KondutoModel {
  id?: string;
  name?: string;
  /** Account creation date (YYYY-MM-DD). */
  created_at?: string;
}
