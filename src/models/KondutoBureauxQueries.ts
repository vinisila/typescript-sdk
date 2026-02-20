import { KondutoModel } from './KondutoModel';

/**
 * Bureau queries response – dynamic key/value pairs.
 */
export interface KondutoBureauxQueriesResponse {
  [key: string]: unknown;
}

/**
 * Bureau query result model.
 * @see http://docs.konduto.com
 */
export class KondutoBureauxQueries extends KondutoModel {
  service?: string;
  response?: KondutoBureauxQueriesResponse;
}
