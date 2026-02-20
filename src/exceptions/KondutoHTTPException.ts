import { KondutoException } from './KondutoException';

/**
 * Thrown whenever Konduto's API responds with an error HTTP status.
 */
export abstract class KondutoHTTPException extends KondutoException {
  constructor(message: string, responseBody?: string) {
    super(responseBody ? `${message} Response body: ${responseBody}` : message);
    this.name = 'KondutoHTTPException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
