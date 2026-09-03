export type ReglementSens = "entrant" | "sortant";
export type ReglementType =
  | "rachat"
  | "vente"
  | "acompte"
  | "solde"
  | "fonderie"
  | "depot_vente"
  /** Reparation payee par le client qui vient rechercher son bijou. */
  | "reparation"
  /** Facture d'un grossiste, payee au fournisseur. */
  | "achat_grossiste";
export type ModeReglement = "especes" | "carte" | "virement" | "cheque";

export interface Reglement {
  id: string;
  /** Absent pour un reglement de fonte : un envoi n'appartient a aucun lot. */
  lot_id: string | null;
  bon_commande_id: string | null;
  /** Envoi en fonte que ce reglement solde, quand la fonderie nous paie. */
  bon_livraison_id: string | null;
  /** Reparation payee. Un reglement pend a l'un de ces rattachements au moins. */
  reparation_id: string | null;
  /** Achat grossiste regle. */
  achat_grossiste_id: string | null;
  document_id: string | null;
  sens: ReglementSens;
  type: ReglementType;
  montant: number;
  mode: ModeReglement;
  date_reglement: string;
  client_id: string | null;
  fonderie_id: string | null;
  notes: string | null;
  created_at: string;
}
