import { KondutoModel } from './KondutoModel';

/**
 * User navigation behavior model. All times are in minutes.
 * @see http://docs.konduto.com
 */
export class KondutoNavigationInfo extends KondutoModel {
  session_time?: number;
  referrer?: string;
  time_site_1d?: number;
  new_accounts_1d?: number;
  password_resets_1d?: number;
  sales_declined_1d?: number;
  sessions_1d?: number;
  time_site_7d?: number;
  new_accounts_7d?: number;
  time_per_page_7d?: number;
  password_resets_7d?: number;
  checkout_count_7d?: number;
  sales_declined_7d?: number;
  sessions_7d?: number;
  time_since_last_sale?: number;
}
