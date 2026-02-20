/**
 * Base exception for all Konduto exceptions.
 * Catch this to handle any Konduto-specific error.
 */
export class KondutoException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'KondutoException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
