import { KondutoModel } from './KondutoModel';
import { KondutoTriggeredDecision } from './enums/KondutoTriggeredDecision';

/**
 * Triggered decision list entry model.
 * @see http://docs.konduto.com
 */
export class KondutoTriggeredDecisionList extends KondutoModel {
  type?: string;
  trigger?: string;
  decision?: KondutoTriggeredDecision;
}
