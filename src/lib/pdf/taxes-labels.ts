/**
 * Libellés fiscaux des documents.
 *
 * Le taux par ligne était calculé à l'identique en quatre endroits, et le
 * libellé de total en deux. Quatre copies d'une règle fiscale, c'est quatre
 * occasions d'en oublier une le jour où un taux change.
 */

type RegimeFiscal = "TPV" | "TMP" | "TFOP" | null | undefined;

/** Taux affiché dans la colonne « taxe » d'une ligne de référence. */
export function tauxLigne(regime: RegimeFiscal, montantTaxe: number): string {
  if (montantTaxe <= 0) return "0%";
  if (regime === "TFOP") return "6.5%";
  if (regime === "TPV") return "TPV";
  return "11.5%";
}

/** Libellé de la ligne de taxe dans le bloc des totaux. */
export function libelleTotalTaxe(
  refs: readonly { regime_fiscal?: RegimeFiscal }[]
): string {
  const regime = refs.find((r) => r.regime_fiscal)?.regime_fiscal;
  if (regime === "TFOP") return "Taxe (TFOP+CRDS)";
  if (regime === "TPV") return "Taxe (Plus-Value)";
  return "Taxe (TMP+CRDS)";
}
