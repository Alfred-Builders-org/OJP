export interface Grossiste {
  id: string;
  nom: string;
  raison_sociale: string | null;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchatGrossiste {
  id: string;
  numero: string;
  grossiste_id: string;
  date_achat: string;
  numero_facture: string | null;
  /** Total toutes taxes comprises : ce qui sort de la caisse. */
  montant_total: number;
  montant_total_ht: number;
  /** TVA deductible sur cet achat. */
  montant_tva: number;
  montant_revente: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Un achat vu depuis la fiche du grossiste, avec le compte de ses articles. */
export interface AchatGrossisteAvecArticles extends AchatGrossiste {
  nb_articles: number;
}

/** Une ligne d'achat en cours de saisie, avant d'entrer en stock. */
export interface LigneAchatGrossiste {
  id: string;
  designation: string;
  reference_fournisseur: string;
  metal: string;
  qualite: string;
  poids: string;
  quantite: string;
  /** Prix hors taxe, tel qu'il figure sur la facture du grossiste. */
  prix_achat: string;
  /**
   * Taux de TVA de la facture d'achat, en pourcentage. La chaine vide vaut
   * "aucune TVA" : le grossiste n'est pas assujetti, ou il vend lui-meme sous
   * le regime de la marge. L'article reste alors revendable sous ce regime.
   */
  tva_taux: string;
  prix_revente: string;
}
