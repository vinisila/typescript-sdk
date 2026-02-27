/**
 * Request for Resolução 6 — Consulta à Interop (Boa Vista SCPC).
 * @see https://docs.konduto.com/reference/resolucao-6-consulta
 */
export interface KondutoResolucao6Request {
  /** Product name (e.g. "RC6"). */
  produto: string;
  /** Product version (e.g. "v1"). */
  versao: string;
  /** CPF or CNPJ to query. */
  documento: string;
}

export interface KondutoBankAccount {
  numero?: string;
  /** CV=Checking, CP=Savings, PP=Prepaid */
  tipo?: string;
  titular?: string;
}

export interface KondutoBankingInfo {
  agencia?: string;
  /** 8-digit institution code. */
  codigoInstituicao?: number;
  conta?: KondutoBankAccount;
}

export interface KondutoR6Dispositivo {
  id?: string;
  ip?: string;
}

export interface KondutoR6Registro {
  /**
   * Activity type:
   * 1=TEF, 2=TED, 3=DOC, 4=PIX, 5=Credit,
   * 6=Boletos, 7=Checks, 8=Cash, 9=Account opening
   */
  atividadeRelacionada?: number;
  /**
   * Channel:
   * 1=Internet, 2=Mobile, 3=In-person, 4=ATM,
   * 5=Call center, 6=Partners, 7=Social media,
   * 8=Interbank, 99=Other
   */
  canal?: number;
  /** 1=Confirmed fraud, 2=Fraud attempt */
  classificacao?: number;
  dataHora?: string;
  dispositivo?: KondutoR6Dispositivo;
  /** 1=Yes (claimant was involved), 2=No */
  envolvimentoReclamante?: number;
  local?: string;
  motivo?: string;
  valorContrato?: number;
  valorTransacao?: number;
}

export interface KondutoOcorrencia {
  informacaoBancariaDestino?: KondutoBankingInfo;
  informacaoExecutor?: KondutoBankingInfo;
  informacaoReclamante?: KondutoBankingInfo;
  instituicaoResponsavel?: KondutoBankingInfo;
  registro?: KondutoR6Registro;
}

export interface KondutoResolucao6Entry {
  documento: string;
  /** 1=CPF, 2=CNPJ */
  tipoDocumento: number;
  metadata: { versaoAPI: string };
  ocorrencias: KondutoOcorrencia[];
}

/** Response for Resolução 6 — Consulta à Interop. */
export interface KondutoResolucao6Response {
  returnAntiFraude: KondutoResolucao6Entry[];
}
