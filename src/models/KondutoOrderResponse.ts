import { KondutoModel } from './KondutoModel';
import { KondutoRecommendation } from './enums/KondutoRecommendation';
import { KondutoDevice } from './KondutoDevice';
import { KondutoNavigationInfo } from './KondutoNavigationInfo';
import { KondutoGeolocation } from './KondutoGeolocation';
import { KondutoTriggeredRules } from './KondutoTriggeredRules';
import { KondutoTriggeredDecisionList } from './KondutoTriggeredDecisionList';
import { KondutoBureauxQueries } from './KondutoBureauxQueries';

/**
 * API response for an order.
 * @see http://docs.konduto.com
 */
export class KondutoOrderResponse extends KondutoModel {
  /** Required. Order identifier. */
  id!: string;
  visitor?: string;
  triggered_rules?: KondutoTriggeredRules[];
  triggered_decision_list?: KondutoTriggeredDecisionList[];
  score?: number;
  recommendation?: KondutoRecommendation;
  bureaux_queries?: KondutoBureauxQueries[];
  device?: KondutoDevice;
  navigation?: KondutoNavigationInfo;
  geolocation?: KondutoGeolocation;
  timestamp?: number;
}
