export interface OrInvestissement {
  id: string;
  designation: string;
  poids: number | null;
  metal: "Or" | "Argent" | "Autres" | null;
  titre: string | null;
  pays: string | null;
  annees: string | null;
  quantite: number;
  prix_achat: number | null;
  prix_revente: number | null;
  /**
   * Coefficients propres a la piece. NULL : suivre les coefficients generaux
   * des parametres — un napoleon et un lingot n'ont ni la meme prime ni la meme
   * liquidite.
   */
  coefficient_achat: number | null;
  coefficient_vente: number | null;
  created_at: string;
  updated_at: string;
}
