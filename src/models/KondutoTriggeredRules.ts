import { KondutoModel } from './KondutoModel';
import { KondutoTriggeredDecision } from './enums/KondutoTriggeredDecision';

/**
 * Triggered rule model.
 * @see http://docs.konduto.com
 */
export class KondutoTriggeredRules extends KondutoModel {
  name?: string;
  decision?: KondutoTriggeredDecision;
}
