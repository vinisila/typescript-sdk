import { KondutoValidaJsonRequest, KondutoValidaJsonResponse } from './models/onboarding/KondutoValidaJsonTypes';
import { KondutoValidaMaisRequest, KondutoValidaMaisResponse } from './models/onboarding/KondutoValidaMaisTypes';
import {
  KondutoValidaMaisCadastroRequest,
  KondutoValidaMaisCadastroResponse,
} from './models/onboarding/KondutoValidaMaisCadastroTypes';
import { KondutoBVSException } from './exceptions/KondutoBVSException';
import { KondutoHTTPExceptionFactory } from './exceptions/KondutoHTTPExceptionFactory';

/**
 * Client for Konduto's BVS (Boa Vista) onboarding and AML JSON services:
 * - Konduto Valida JSON  — CPF/person registration lookup
 * - Konduto Valida Mais  — CPF ↔ credit card relationship scoring
 * - Konduto Valida Mais Cadastro — CPF ↔ registration data scoring
 *
 * All three endpoints share the same `user`/`password` header authentication.
 *
 * @see https://docs.konduto.com/reference/konduto-valida-json
 * @see https://docs.konduto.com/reference/konduto-valida-mais
 * @see https://docs.konduto.com/reference/konduto-valida-mais-cadastro
 */
export class KondutoBVS {
  private static readonly VALIDA_JSON_URL =
    'https://consumer.bvsnet.com.br/dadoscadastrais/v01/people/search';
  private static readonly VALIDA_MAIS_URL =
    'https://consumer.bvsnet.com.br/valida/v01/cartao';
  private static readonly VALIDA_MAIS_CADASTRO_URL =
    'https://consumer.bvsnet.com.br/valida/v01/cadastro';

  private readonly user: string;
  private readonly password: string;

  /**
   * @param user     BVS client code (max 8 numeric characters).
   * @param password BVS client password (max 6 characters).
   */
  constructor(user: string, password: string) {
    if (!user || user.length > 8) {
      throw new RangeError(
        `Invalid BVS user code: must be 1–8 characters. Got: "${user}"`
      );
    }
    if (!password || password.length > 6) {
      throw new RangeError(
        `Invalid BVS password: must be 1–6 characters. Got: "${password}"`
      );
    }
    this.user = user;
    this.password = password;
  }

  private buildHeaders(): Record<string, string> {
    return {
      user: this.user,
      password: this.password,
      'content-type': 'application/json',
    };
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      // Try to parse BVS application error: { codigo, mensagem }
      try {
        const err = JSON.parse(text) as { codigo?: string; mensagem?: string };
        if (err.codigo && err.mensagem) {
          throw new KondutoBVSException(err.codigo, err.mensagem);
        }
      } catch (e) {
        if (e instanceof KondutoBVSException) throw e;
      }

      // Fall back to generic HTTP exceptions
      const httpEx = KondutoHTTPExceptionFactory.buildException(response.status, text);
      throw httpEx ?? new Error(`HTTP ${response.status}: ${text}`);
    }

    return JSON.parse(text) as T;
  }

  /**
   * Konduto Valida - JSON: person registration lookup by CPF, phone, email, or name.
   *
   * Modules:
   * - CB — Basic registration (nome, CPF status, politically exposed indicator)
   * - CC — Complete registration (extends CB with birth data, marital status, RG)
   * - LO — Location (addresses, phones, emails)
   * - QA — Qualification (related persons, household members)
   *
   * @example
   * const result = await bvs.validaJson({ cpf: '12345678909', modules: 'CB' });
   * console.log(result.cadastroBasico?.nome);
   */
  async validaJson(request: KondutoValidaJsonRequest): Promise<KondutoValidaJsonResponse> {
    return this.post<KondutoValidaJsonResponse>(KondutoBVS.VALIDA_JSON_URL, request);
  }

  /**
   * Konduto Valida Mais: verifies the relationship between a CPF and a credit card.
   * Returns a score from -1 (deceased/not found/minor) to 5 (maximum link).
   *
   * @example
   * const result = await bvs.validaMais({ cpf: '12345678909', bin: '527468', last_four: '1234' });
   * console.log(result.score, result.relationshipdg);
   */
  async validaMais(request: KondutoValidaMaisRequest): Promise<KondutoValidaMaisResponse> {
    return this.post<KondutoValidaMaisResponse>(KondutoBVS.VALIDA_MAIS_URL, request);
  }

  /**
   * Konduto Valida Mais Cadastro: verifies how well supplied registration data
   * (name, phone, ZIP, email, mother name) matches the CPF holder's records.
   * Returns a score from -1 (deceased/not found/minor) to 5 (maximum match).
   *
   * @example
   * const result = await bvs.validaMaisCadastro({ cpf: '12345678909', name: 'Jane Doe', email: 'jane@example.com' });
   * console.log(result.score, result.combinationData);
   */
  async validaMaisCadastro(
    request: KondutoValidaMaisCadastroRequest
  ): Promise<KondutoValidaMaisCadastroResponse> {
    return this.post<KondutoValidaMaisCadastroResponse>(
      KondutoBVS.VALIDA_MAIS_CADASTRO_URL,
      request
    );
  }
}
