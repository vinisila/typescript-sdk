import { KondutoModel } from './KondutoModel';
import { KondutoLoyaltyProgram } from './KondutoLoyaltyProgram';

/**
 * Passenger model.
 * @see http://docs.konduto.com
 */
export class KondutoPassenger extends KondutoModel {
  /** Required. Passenger name. */
  name!: string;
  /** Required. Passport or ID number. */
  document!: string;
  /** Required. Document type. */
  document_type!: string;
  /** Required. Date of birth (YYYY-MM-DD). */
  dob!: string;

  nationality?: string;
  frequent_traveler?: boolean;
  special_needs?: boolean;
  loyalty?: KondutoLoyaltyProgram;
}
