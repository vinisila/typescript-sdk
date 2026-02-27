import { KondutoException } from './KondutoException';

/**
 * Thrown when the Resolução 6 / Interop service returns an error.
 * codigo corresponds to Boa Vista SCPC codes (e.g. "MSAUT01").
 */
export class KondutoResolucao6Exception extends KondutoException {
  public readonly codigo: string;
  public readonly rawResponse: string;

  constructor(codigo: string, mensagem: string, rawResponse: string) {
    super(`[${codigo}] ${mensagem}`);
    this.name = 'KondutoResolucao6Exception';
    this.codigo = codigo;
    this.rawResponse = rawResponse;
  }
}
