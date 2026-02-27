import { KondutoException } from './KondutoException';

/**
 * Thrown when Konduto Define Cadastro returns an error.
 * code corresponds to the Boa Vista error codes (e.g. "001", "050", "999").
 */
export class KondutoDefineException extends KondutoException {
  public readonly code: string;
  public readonly rawResponse: string;

  constructor(code: string, rawResponse: string) {
    super(`Konduto Define Cadastro error [${code}]`);
    this.name = 'KondutoDefineException';
    this.code = code;
    this.rawResponse = rawResponse;
  }
}
