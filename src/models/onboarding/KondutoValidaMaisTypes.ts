/**
 * Request for Konduto Valida Mais — CPF ↔ card relationship scoring.
 * @see https://docs.konduto.com/reference/konduto-valida-mais
 */
export interface KondutoValidaMaisRequest {
  /** CPF to query (max 11 chars). */
  cpf: string;
  /** Card BIN — first 6 or 8 digits. */
  bin: string;
  /** Last 4 digits of the card. */
  last_four: string;
}

/**
 * Response for Konduto Valida Mais.
 *
 * Score interpretation:
 * | Score | relationshipdg          | Meaning                         |
 * |-------|-------------------------|---------------------------------|
 * |  -1   | OBITO                   | CPF marked as deceased          |
 * |  -1   | MISSING                 | CPF not found in any database   |
 * |  -1   | CPF MENOR DE IDADE      | CPF belongs to a minor          |
 * |   0   | SEM VINCULO             | No link between CPF and card    |
 * |   1   | VINCULO BAIXO           | Low — link found in 1 source    |
 * |  2–3  | VINCULO MEDIO           | Medium — link in 2+ sources     |
 * |  4–5  | VINCULO ALTO            | High — link across all sources  |
 */
export interface KondutoValidaMaisResponse {
  cpf: string;
  bin: string;
  last_four: string;
  /** Card brand (e.g. MASTERCARD) or "-" if not found. */
  card_brand: string;
  /** Bank name or "-" if not found. */
  bank: string;
  /** Relationship score from -1 to 5. */
  score: number;
  relationshipdg: string;
}
