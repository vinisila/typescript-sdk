import { KondutoModel } from './KondutoModel';

/**
 * Shopping cart item model.
 * @see http://docs.konduto.com
 */
export class KondutoItem extends KondutoModel {
  sku?: string;
  category?: number;
  name?: string;
  description?: string;
  product_code?: string;
  unit_cost?: number;
  quantity?: number;
  discount?: number;
  /** Creation date (YYYY-MM-DD). */
  created_at?: string;

  toJSON(): Record<string, unknown> {
    const result = super.toJSON();
    // Only include discount if non-zero
    if (result['discount'] === 0) {
      delete result['discount'];
    }
    return result;
  }
}
