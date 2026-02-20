import { KondutoModel } from './KondutoModel';

/**
 * Address model (shipping or billing).
 * @see http://docs.konduto.com
 */
export class KondutoAddress extends KondutoModel {
  name?: string;
  address1?: string;
  address2?: string;
  zip?: string;
  city?: string;
  state?: string;
  country?: string;

  withName(name: string): KondutoAddress {
    this.name = name;
    return this;
  }
}
