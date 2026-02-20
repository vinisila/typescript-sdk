import { KondutoModel } from './KondutoModel';

/**
 * Travel leg information model.
 * @see http://docs.konduto.com
 */
export class KondutoTravelInformation extends KondutoModel {
  origin_city?: string;
  destination_city?: string;
  origin_airport?: string;
  destination_airport?: string;
  /** Required. Travel date (YYYY-MM-DD). */
  date!: string;
  number_of_connections?: number;
  class?: string;
  fare_basis?: string;
  company?: string;
}
