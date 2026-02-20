import { KondutoException } from './KondutoException';
import { KondutoModel } from '../models/KondutoModel';

/**
 * Thrown when a KondutoModel instance is invalid.
 */
export class KondutoInvalidEntityException extends KondutoException {
  constructor(entity: KondutoModel) {
    super(`${entity.constructor.name} is invalid: ${entity.getError()}`);
    this.name = 'KondutoInvalidEntityException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
