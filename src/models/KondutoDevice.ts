import { KondutoModel } from './KondutoModel';

/**
 * Device fingerprinting model.
 * @see http://docs.konduto.com
 */
export class KondutoDevice extends KondutoModel {
  user_id?: string;
  fingerprint?: string;
  platform?: string;
  browser?: string;
  language?: string;
  timezone?: string;
  cookie?: boolean;
  javascript?: boolean;
  flash?: boolean;
  ip?: string;
}
