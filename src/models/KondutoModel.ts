import { KondutoInvalidEntityException } from '../exceptions/KondutoInvalidEntityException';

export class KondutoModel {
  private _error: string | null = null;

  getError(): string | null {
    return this._error;
  }

  /**
   * Returns a plain object representation for JSON serialization.
   * Excludes private fields (prefixed with _) and null/undefined values.
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      if (key.startsWith('_')) continue;
      const value = (this as Record<string, unknown>)[key];
      if (value !== null && value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Serializes this model to a JSON string.
   * @throws KondutoInvalidEntityException if serialization fails
   */
  toJson(): string {
    try {
      return JSON.stringify(this);
    } catch (e) {
      throw new KondutoInvalidEntityException(this);
    }
  }

  /**
   * Validates this model by attempting serialization.
   * @returns true if valid, false otherwise (use getError() to retrieve the error message)
   */
  isValid(): boolean {
    this._error = null;
    try {
      JSON.stringify(this);
      return true;
    } catch (e) {
      this._error = (e as Error).message;
      return false;
    }
  }

  /**
   * Deserializes a JSON string into an instance of the given type.
   * For polymorphic payment types, use KondutoUtils.loadJson() instead.
   */
  static fromJson<T>(json: string): T {
    return JSON.parse(json) as T;
  }
}
