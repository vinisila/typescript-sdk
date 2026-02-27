/** Modules available for Konduto Valida - JSON query. */
export type KondutoValidaModule = 'CB' | 'CC' | 'LO' | 'QA';

/**
 * Request for Konduto Valida - JSON.
 * At least one of cpf, phone, email, or name is recommended.
 * dateOfBirth may only be used together with name.
 * @see https://docs.konduto.com/reference/konduto-valida-json
 */
export interface KondutoValidaJsonRequest {
  /** CPF to query (max 11 chars). */
  cpf?: string;
  /** Phone number (10–11 chars). */
  phone?: string;
  /** Email address. */
  email?: string;
  /** Person name. */
  name?: string;
  /** Date of birth in dd/MM/yyyy format — only usable together with name. */
  dateOfBirth?: string;
  /** Comma-separated module codes: CB, CC, LO, QA. */
  modules: string;
}

export interface KondutoCadastroBasico {
  cpf: string;
  nome: string;
  nomeSocial?: string;
  nomeMae?: string;
  dataNascimento?: string;
  situacaoCPF?: string;
  pessoaPoliticamenteExposta?: boolean;
}

export interface KondutoCadastroCompleto extends KondutoCadastroBasico {
  dataInscricaoCPF?: string;
  dataAtualizacaoCPF?: string;
  regiaoOrigemCPF?: string;
  nacionalidade?: string;
  signo?: string;
  /** M, F, or Indefinido */
  sexo?: string;
  grauInstrucao?: string;
  estadoCivil?: string;
  tituloEleitor?: string;
  rg?: string;
  orgaoExpedidorRG?: string;
  dataEmissaoRG?: string;
  ufRG?: string;
  /** Sim or Não */
  obito?: string;
}

export interface KondutoValidaEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface KondutoValidaTelefone {
  numero?: string;
  tipo?: string;
}

export interface KondutoLocalizacao {
  cpf: string;
  emails?: string[];
  enderecos?: KondutoValidaEndereco[];
  telefones?: KondutoValidaTelefone[];
  enderecosInstalacao?: KondutoValidaEndereco[];
}

export interface KondutoPessoaRelacionada {
  cpf?: string;
  nome?: string;
  relacionamento?: string;
}

export interface KondutoHousehold {
  cpf?: string;
  nome?: string;
}

export interface KondutoQualificacao {
  cpf: string;
  obito?: string;
  pessoasRelacionada?: KondutoPessoaRelacionada[];
  houseHolds?: KondutoHousehold[];
}

/**
 * Response for Konduto Valida - JSON.
 * Fields present depend on the modules requested.
 */
export interface KondutoValidaJsonResponse {
  /** Present when module CB or CC was requested. */
  cadastroBasico?: KondutoCadastroBasico;
  /** Present when module CC was requested. */
  cadastroCompleto?: KondutoCadastroCompleto;
  /** Present when module LO was requested. */
  localizacao?: KondutoLocalizacao;
  /** Present when module QA was requested. */
  qualificacao?: KondutoQualificacao;
  /** Warning message (e.g. underage CPF holder). */
  mensagem?: { codigo: string; mensagem: string };
  /** Returned when a phone/name search matches multiple CPFs. */
  retornoBasico?: Array<{ cpf: string; nome: string }>;
}
