import { KondutoModel } from './KondutoModel';
import { KondutoCustomer } from './KondutoCustomer';
import { KondutoAddress } from './KondutoAddress';
import { KondutoGeolocation } from './KondutoGeolocation';
import { KondutoDevice } from './KondutoDevice';
import { KondutoNavigationInfo } from './KondutoNavigationInfo';
import { KondutoTravel } from './KondutoTravel';
import { KondutoItem } from './KondutoItem';
import { KondutoSeller } from './KondutoSeller';
import { KondutoRecommendation } from './enums/KondutoRecommendation';
import { KondutoTriggeredRules } from './KondutoTriggeredRules';
import { KondutoTriggeredDecisionList } from './KondutoTriggeredDecisionList';
import { KondutoBureauxQueries } from './KondutoBureauxQueries';
import { KondutoPayment } from './payments/KondutoPayment';
import { KondutoOrderResponse } from './KondutoOrderResponse';

/**
 * Main order entity submitted for fraud analysis.
 * @see http://docs.konduto.com
 */
export class KondutoOrder extends KondutoModel {
  /** Required. Unique order identifier. */
  id!: string;
  /** Visitor ID from the JavaScript snippet. */
  visitor?: string;
  /** Unix timestamp. */
  timestamp?: number;
  /** Required. Order total amount. */
  total_amount!: number;
  /** Shipping cost. */
  shipping_amount?: number;
  /** Tax amount. */
  tax_amount?: number;
  /** Required. Customer details. */
  customer!: KondutoCustomer;
  /** ISO-4712 currency code. */
  currency?: string;
  /** Number of installments. */
  installments?: number;
  /** Customer's IPv4 address. */
  ip?: string;

  // Response fields – populated after analysis
  score?: number;
  recommendation?: KondutoRecommendation;
  bureaux_queries?: KondutoBureauxQueries[];
  triggered_rules?: KondutoTriggeredRules[];
  triggered_decision_list?: KondutoTriggeredDecisionList[];

  /** Recipient address. JSON key: "shipping" */
  shipping?: KondutoAddress;
  /** Cardholder address. JSON key: "billing" */
  billing?: KondutoAddress;
  geolocation?: KondutoGeolocation;
  device?: KondutoDevice;
  /** User navigation behavior. JSON key: "navigation" */
  navigation?: KondutoNavigationInfo;
  travel?: KondutoTravel;

  /** Payment methods. JSON key: "payment" */
  payment?: KondutoPayment[];
  /** Items in the cart. */
  shopping_cart?: KondutoItem[];

  /** Whether Konduto should analyze this order (default: true). */
  analyze: boolean = true;

  /** Order status. */
  status?: string;
  /** First message timestamp (YYYY-MM-DDThh:mmZ). */
  first_message?: string;
  messages_exchanged?: number;
  /** Purchase timestamp (YYYY-MM-DDThh:mmZ). */
  purchased_at?: string;
  seller?: KondutoSeller;

  toJSON(): Record<string, unknown> {
    if (this.shopping_cart && this.travel) {
      throw new Error('Shopping cart and travel object cannot exist in the same order.');
    }
    return super.toJSON();
  }

  /**
   * Merges an API order response into this order, populating analysis results.
   */
  mergeKondutoOrderResponse(response: KondutoOrderResponse): void {
    this.device = response.device;
    this.recommendation = response.recommendation;
    this.score = response.score;
    this.navigation = response.navigation;
    this.geolocation = response.geolocation;
    this.timestamp = response.timestamp;
    this.bureaux_queries = response.bureaux_queries;
    this.triggered_rules = response.triggered_rules;
    this.triggered_decision_list = response.triggered_decision_list;
  }
}
