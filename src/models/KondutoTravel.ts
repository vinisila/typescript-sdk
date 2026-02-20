import { KondutoModel } from './KondutoModel';
import { KondutoTravelType } from './enums/KondutoTravelType';
import { KondutoPassenger } from './KondutoPassenger';
import { KondutoTravelInformation } from './KondutoTravelInformation';

/**
 * Travel/flight information model.
 * @see http://docs.konduto.com
 */
export class KondutoTravel extends KondutoModel {
  /** Required. Travel type (flight or bus). JSON key: "type" */
  type!: KondutoTravelType;
  /** Required. List of passengers. */
  passengers!: KondutoPassenger[];
  /** Required. Departure information. */
  departure!: KondutoTravelInformation;
  /**
   * Return trip information (optional).
   * Stored as return_travel internally; serialized as "return" in JSON.
   */
  return_travel?: KondutoTravelInformation;
  /** Expiration date (YYYY-MM-DD). */
  expiration_date?: string;

  toJSON(): Record<string, unknown> {
    const result = super.toJSON();
    // Map return_travel → return to match the API's JSON key
    if (result['return_travel'] !== undefined) {
      result['return'] = result['return_travel'];
      delete result['return_travel'];
    }
    return result;
  }
}
