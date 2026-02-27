/**
 * Optional data blocks to include in a Define Cadastro request.
 */
export interface KondutoDefineCadastroOpcionais {
  /** Board of directors / partner list. */
  quadroSocial?: boolean;
  /** Shareholding / company participations. */
  participacoes?: boolean;
  /** Revenue information. */
  faturamento?: boolean;
}

/**
 * Extra blocks (returned when optional results exceed 10 records).
 * Each extra depends on a matching optional being enabled.
 */
export interface KondutoDefineCadastroExtras {
  /** Requires quadroSocial. */
  administradores?: boolean;
  /** Requires quadroSocial. */
  socios?: boolean;
  /** Requires participacoes. */
  participacoesEmpresa?: boolean;
  /** Requires participacoes. */
  participacoesSocio?: boolean;
  sintegra?: boolean;
}

/**
 * Request for Konduto Define Cadastro (Boa Vista XML service).
 * Looks up company data by CNPJ.
 * @see https://docs.konduto.com/reference/konduto-define-cadastro
 */
export interface KondutoDefineCadastroRequest {
  /** BVS username. */
  usuario: string;
  /** BVS password. */
  senha: string;
  /** 14-digit CNPJ. */
  cnpj: string;
  opcionais?: KondutoDefineCadastroOpcionais;
  extras?: KondutoDefineCadastroExtras;
}

export interface KondutoDefineIdentificacao {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  situacaoCnpj?: string;
  dataAberturaEmpresa?: string;
  nire?: string;
  inscricaoEstadual?: string;
  naturezaJuridica?: string;
  segmentoEmpresarial?: string;
  capitalSocial?: string;
  filiais?: string;
  situacaoFgts?: string;
  activityCodes?: string[];
}

export interface KondutoDefineLocalizacao {
  logradouro?: string;
  bairro?: string;
  codigoIbge?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  telefones?: string[];
}

export interface KondutoDefineAlertaFraude {
  inconsistencias?: string[];
}

export interface KondutoDefineSocio {
  nome?: string;
  cpf?: string;
  dataEntrada?: string;
  cargo?: string;
  situacaoCpf?: string;
  indicadorDebito?: string;
  indicadorFraude?: string;
}

export interface KondutoDefineParticipacao {
  cnpj?: string;
  percentual?: string;
  indicadorDebito?: string;
  indicadorFraude?: string;
}

export interface KondutoDefineFaturamento {
  faixaFaturamento?: string;
  faturamentoAnual?: string;
}

/**
 * Response for Konduto Define Cadastro.
 * rawXml always contains the full XML response.
 * Structured fields are parsed on a best-effort basis.
 */
export interface KondutoDefineCadastroResponse {
  /** Raw XML string returned by Boa Vista. */
  rawXml: string;
  identificacao?: KondutoDefineIdentificacao;
  localizacao?: KondutoDefineLocalizacao;
  alertaFraude?: KondutoDefineAlertaFraude;
  /** Present if opcionais.quadroSocial was requested. */
  socios?: KondutoDefineSocio[];
  /** Present if opcionais.participacoes was requested. */
  participacoes?: KondutoDefineParticipacao[];
  /** Present if opcionais.faturamento was requested. */
  faturamento?: KondutoDefineFaturamento;
}
