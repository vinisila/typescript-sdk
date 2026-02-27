/**
 * Request for Konduto Valida Mais Cadastro — CPF ↔ registration data scoring.
 * @see https://docs.konduto.com/reference/konduto-valida-mais-cadastro
 */
export interface KondutoValidaMaisCadastroRequest {
  /** CPF to query (11 chars). */
  cpf: string;
  name?: string;
  /** Phone number (10–11 chars). */
  phone?: string;
  /** ZIP code (max 8 chars). */
  zipCode?: string;
  email?: string;
  motherName?: string;
}

/**
 * Flags indicating which of the supplied fields matched the CPF holder's records.
 */
export interface KondutoCombinationData {
  name: boolean;
  phone: boolean;
  zipCode: boolean;
  email: boolean;
  motherName: boolean;
  death: boolean;
  underage: boolean;
}

/**
 * Response for Konduto Valida Mais Cadastro.
 *
 * Score interpretation:
 * | Score | relationshipdg | Meaning                              |
 * |-------|----------------|--------------------------------------|
 * |  -1   | DECEASED       | CPF marked deceased at Receita Fed.  |
 * |  -1   | CPF NOT FOUND  | CPF not found in database            |
 * |  -1   | UNDERAGE       | CPF holder is a minor                |
 * |   0   | NO MATCH       | No additional fields matched         |
 * |   1   | LOW            | 1 additional field matched           |
 * |  2–3  | MEDIUM         | 2–3 fields matched                   |
 * |  4–5  | HIGH           | 4–5 fields matched                   |
 */
export interface KondutoValidaMaisCadastroResponse {
  cpf: string;
  /** Score from -1 to 5. */
  score: number;
  relationshipdg: string;
  combinationData: KondutoCombinationData;
}
