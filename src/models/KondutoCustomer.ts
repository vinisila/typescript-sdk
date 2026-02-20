import { KondutoModel } from './KondutoModel';

/**
 * Customer model.
 * @see http://docs.konduto.com
 */
export class KondutoCustomer extends KondutoModel {
  /** Required. Unique customer identifier. */
  id!: string;
  /** Required. Full name. */
  name!: string;
  /** Required. Email address. */
  email!: string;

  tax_id?: string;
  phone1?: string;
  phone2?: string;
  vip?: boolean;
  /** Whether this is a new account. */
  new?: boolean;
  /** Account creation date (YYYY-MM-DD). */
  created_at?: string;
  /** Date of birth (YYYY-MM-DD). */
  dob?: string;
}
