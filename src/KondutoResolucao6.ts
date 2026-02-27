import { createSign } from 'crypto';
import {
  KondutoResolucao6Request,
  KondutoResolucao6Response,
} from './models/onboarding/KondutoResolucao6Types';
import { KondutoResolucao6Exception } from './exceptions/KondutoResolucao6Exception';

/**
 * Client for Resolução 6 — Consulta à Interop (Boa Vista SCPC).
 * Queries fraud occurrence records for a CPF or CNPJ registered by
 * financial institutions under Brazil's Resolução BCB nº 6.
 *
 * Authentication uses three headers:
 * - accessCode: client code from Boa Vista
 * - secretId:   client secret from Boa Vista
 * - signature:  RSA-SHA256 signature of the documento, base64-encoded
 *
 * @see https://docs.konduto.com/reference/resolucao-6-consulta
 */
export class KondutoResolucao6 {
  private static readonly URL =
    'https://api.boavistascpc.com.br/orquestrador/v1/consulta';

  private readonly accessCode: string;
  private readonly secretId: string;
  private readonly privateKey: string;

  /**
   * @param accessCode  Client code provided during Boa Vista registration.
   * @param secretId    Client secret provided during Boa Vista registration.
   * @param privateKey  RSA private key in PEM format used to sign each request.
   */
  constructor(accessCode: string, secretId: string, privateKey: string) {
    if (!accessCode) throw new Error('accessCode is required');
    if (!secretId)   throw new Error('secretId is required');
    if (!privateKey) throw new Error('privateKey is required');
    this.accessCode = accessCode;
    this.secretId   = secretId;
    this.privateKey = privateKey;
  }

  /**
   * Generates the RSA-SHA256 signature for the given documento.
   * The Boa Vista API requires the documento value to be signed with
   * the client's private RSA key.
   */
  private signDocumento(documento: string): string {
    const sign = createSign('RSA-SHA256');
    sign.update(documento, 'utf-8');
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Queries fraud occurrence records for a CPF or CNPJ.
   *
   * Error codes returned by Boa Vista SCPC:
   * - MSAUT01: Invalid request / bad parameters (400)
   * - MSAUT02: Invalid document (422)
   * - MSAUT03: Unauthorized (401)
   * - MSAUT04: Score model not authorized (401)
   * - MSAUT07: Access not allowed at current time (401)
   * - MSAUT10: Service unavailable (500)
   * - MSAUT11: Product/version not authorized (401)
   * - MSAUT13: Too many failed requests — IP/user blocked (401)
   *
   * @example
   * const r6 = new KondutoResolucao6(accessCode, secretId, privateKeyPem);
   * const result = await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '08880787063' });
   * console.log(result.returnAntiFraude[0].ocorrencias);
   */
  async consulta(request: KondutoResolucao6Request): Promise<KondutoResolucao6Response> {
    const signature = this.signDocumento(request.documento);

    const response = await fetch(KondutoResolucao6.URL, {
      method: 'POST',
      headers: {
        accessCode:     this.accessCode,
        secretId:       this.secretId,
        signature,
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const text = await response.text();

    if (!response.ok) {
      try {
        const err = JSON.parse(text) as {
          codigo?: string;
          mensagem?: string;
          erro?: string;
        };
        throw new KondutoResolucao6Exception(
          err.codigo ?? String(response.status),
          err.mensagem ?? err.erro ?? 'Unknown error',
          text
        );
      } catch (e) {
        if (e instanceof KondutoResolucao6Exception) throw e;
        throw new KondutoResolucao6Exception(String(response.status), text, text);
      }
    }

    return JSON.parse(text) as KondutoResolucao6Response;
  }
}
