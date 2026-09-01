export type FonderieLotType = "commande" | "fonte";

export interface FonderieLotRow {
  id: string;
  numero: string;
  type: FonderieLotType;
  fonderie_id: string;
  fonderie_nom: string;
  statut: string;
  montant: number;
  nb_lignes: number;
  date_creation: string;
  date_envoi: string | null;
  date_reception: string | null;
}

/**
 * Une ligne d'envoi dont la fonderie n'a pas confirme ce qu'on annoncait :
 * titrage, poids ou montant. C'est la matiere du suivi des ecarts.
 */
export interface EcartRow {
  id: string;
  bdl_id: string;
  bdl_numero: string;
  fonderie_nom: string;
  designation: string;
  metal: string | null;
  titrage_declare: string | null;
  titrage_reel: string | null;
  poids_declare: number | null;
  poids_reel: number | null;
  valeur_estimee: number | null;
  valeur_reelle: number | null;
  ecart_valeur: number | null;
  ecart_titrage: boolean;
  ecart_poids: boolean;
  ecart_notes: string | null;
  date_test: string | null;
}
