import { KondutoException } from './KondutoException';

/**
 * Thrown when Konduto's API responds with something unexpected.
 */
export class KondutoUnexpectedAPIResponseException extends KondutoException {
  constructor(responseBody: string) {
    super(`Unexpected API response: ${responseBody}`);
    this.name = 'KondutoUnexpectedAPIResponseException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
