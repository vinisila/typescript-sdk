import { KondutoModel } from './KondutoModel';

/**
 * Geolocation model.
 * @see http://docs.konduto.com
 */
export class KondutoGeolocation extends KondutoModel {
  city?: string;
  state?: string;
  country?: string;
}
