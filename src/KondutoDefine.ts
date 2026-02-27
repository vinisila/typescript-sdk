import {
  KondutoDefineCadastroRequest,
  KondutoDefineCadastroResponse,
  KondutoDefineSocio,
  KondutoDefineParticipacao,
} from './models/onboarding/KondutoDefineCadastroTypes';
import { KondutoDefineException } from './exceptions/KondutoDefineException';

/**
 * Client for Konduto Define Cadastro — CNPJ company data lookup via Boa Vista.
 * Uses the XML protocol over HTTPS.
 *
 * @see https://docs.konduto.com/reference/konduto-define-cadastro
 */
export class KondutoDefine {
  private static readonly URL =
    'https://define.bvsnet.com.br/DefineXml/servicos/defineCadastro/v5';

  /**
   * Builds the XML request body from a KondutoDefineCadastroRequest.
   */
  static buildXml(request: KondutoDefineCadastroRequest): string {
    const opt = request.opcionais;
    const ext = request.extras;

    const opcionaisXml =
      opt
        ? `<opcionais>${[
            opt.quadroSocial    ? '<quadroSocial/>'    : '',
            opt.participacoes   ? '<participacoes/>'   : '',
            opt.faturamento     ? '<faturamento/>'     : '',
          ].join('')}</opcionais>`
        : '';

    const extrasXml =
      ext
        ? `<extras>${[
            ext.administradores      ? '<administradores/>'      : '',
            ext.socios               ? '<socios/>'               : '',
            ext.participacoesEmpresa ? '<participacoesEmpresa/>' : '',
            ext.participacoesSocio   ? '<participacoesSocio/>'   : '',
            ext.sintegra             ? '<sintegra/>'             : '',
          ].join('')}</extras>`
        : '';

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<defineCadastro>` +
      `<usuario>${KondutoDefine.escapeXml(request.usuario)}</usuario>` +
      `<senha>${KondutoDefine.escapeXml(request.senha)}</senha>` +
      `<cnpj>${KondutoDefine.escapeXml(request.cnpj)}</cnpj>` +
      opcionaisXml +
      extrasXml +
      `</defineCadastro>`
    );
  }

  /** Escapes XML special characters in a string value. */
  private static escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /** Extracts the text content of the first matching XML tag. */
  private static extract(xml: string, tag: string): string | undefined {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
    return match ? match[1] : undefined;
  }

  /** Extracts all text values for a repeating XML tag. */
  private static extractAll(xml: string, tag: string): string[] {
    return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`, 'g'))].map(
      m => m[1]
    );
  }

  /**
   * Extracts all occurrences of a repeating block delimited by <blockTag>…</blockTag>
   * and maps each to a structured object using the provided field extractor.
   */
  private static extractBlocks<T>(
    xml: string,
    blockTag: string,
    mapper: (block: string) => T
  ): T[] {
    const regex = new RegExp(`<${blockTag}>[\\s\\S]*?<\\/${blockTag}>`, 'g');
    return [...xml.matchAll(regex)].map(m => mapper(m[0]));
  }

  /**
   * Parses the XML response into a KondutoDefineCadastroResponse.
   * rawXml is always included for cases where the parser doesn't cover a field.
   */
  private parseResponse(rawXml: string): KondutoDefineCadastroResponse {
    const x = KondutoDefine.extract.bind(null, rawXml);
    const xa = KondutoDefine.extractAll.bind(null, rawXml);

    const socios: KondutoDefineSocio[] = KondutoDefine.extractBlocks(
      rawXml,
      'socio',
      block => ({
        nome:             KondutoDefine.extract(block, 'nome'),
        cpf:              KondutoDefine.extract(block, 'cpf'),
        dataEntrada:      KondutoDefine.extract(block, 'dataEntrada'),
        cargo:            KondutoDefine.extract(block, 'cargo'),
        situacaoCpf:      KondutoDefine.extract(block, 'situacaoCpf'),
        indicadorDebito:  KondutoDefine.extract(block, 'indicadorDebito'),
        indicadorFraude:  KondutoDefine.extract(block, 'indicadorFraude'),
      })
    );

    const participacoes: KondutoDefineParticipacao[] = KondutoDefine.extractBlocks(
      rawXml,
      'participacao',
      block => ({
        cnpj:            KondutoDefine.extract(block, 'cnpj'),
        percentual:      KondutoDefine.extract(block, 'percentual'),
        indicadorDebito: KondutoDefine.extract(block, 'indicadorDebito'),
        indicadorFraude: KondutoDefine.extract(block, 'indicadorFraude'),
      })
    );

    return {
      rawXml,
      identificacao: {
        cnpj:                x('cnpj'),
        razaoSocial:         x('razaoSocial'),
        nomeFantasia:        x('nomeFantasia'),
        situacaoCnpj:        x('situacaoCnpj'),
        dataAberturaEmpresa: x('dataAberturaEmpresa'),
        nire:                x('nire'),
        inscricaoEstadual:   x('inscricaoEstadual'),
        naturezaJuridica:    x('naturezaJuridica'),
        segmentoEmpresarial: x('segmentoEmpresarial'),
        capitalSocial:       x('capitalSocial'),
        filiais:             x('filiais'),
        situacaoFgts:        x('situacaoFgts'),
        activityCodes:       xa('cnae'),
      },
      localizacao: {
        logradouro:  x('logradouro'),
        bairro:      x('bairro'),
        codigoIbge:  x('codigoIbge'),
        cep:         x('cep'),
        municipio:   x('municipio'),
        uf:          x('uf'),
        telefones:   xa('telefone'),
      },
      alertaFraude: {
        inconsistencias: xa('inconsistencia'),
      },
      socios:       socios.length > 0 ? socios : undefined,
      participacoes: participacoes.length > 0 ? participacoes : undefined,
      faturamento: {
        faixaFaturamento: x('faixaFaturamento'),
        faturamentoAnual: x('faturamentoAnual'),
      },
    };
  }

  /**
   * Queries CNPJ company data from Konduto Define Cadastro (Boa Vista XML service).
   *
   * Error codes:
   * - 000: Invalid input contract
   * - 001: CNPJ cannot be empty
   * - 050: Invalid CNPJ format
   * - 035–038: Tag dependency violations
   * - 999: Authentication failure
   * - HTTP 403: Malformed XML
   *
   * @example
   * const define = new KondutoDefine();
   * const result = await define.defineCadastro({
   *   usuario: 'myuser',
   *   senha: 'mypass',
   *   cnpj: '12345678000195',
   *   opcionais: { quadroSocial: true },
   * });
   * console.log(result.identificacao?.razaoSocial);
   */
  async defineCadastro(
    request: KondutoDefineCadastroRequest
  ): Promise<KondutoDefineCadastroResponse> {
    const xml = KondutoDefine.buildXml(request);

    const response = await fetch(KondutoDefine.URL, {
      method: 'POST',
      headers: { 'content-type': 'application/xml; charset=UTF-8' },
      body: xml,
    });

    const rawXml = await response.text();

    if (!response.ok) {
      const match = rawXml.match(/<codigo>(\d+)<\/codigo>/);
      const code = match ? match[1] : String(response.status);
      throw new KondutoDefineException(code, rawXml);
    }

    return this.parseResponse(rawXml);
  }
}
