import { KondutoException } from './KondutoException';

/**
 * Thrown when a BVS service (Valida JSON, Valida Mais, Valida Mais Cadastro)
 * returns an application-level error in its { codigo, mensagem } format.
 */
export class KondutoBVSException extends KondutoException {
  public readonly codigo: string;

  constructor(codigo: string, mensagem: string) {
    super(`[${codigo}] ${mensagem}`);
    this.name = 'KondutoBVSException';
    this.codigo = codigo;
  }
}
