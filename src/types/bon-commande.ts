import type { Fonderie } from "./fonderie";
import type { VenteLigne } from "./vente";

export type BonCommandeStatus = "brouillon" | "envoye" | "recu" | "paye" | "annule";

export interface BonCommande {
  id: string;
  numero: string;
  fonderie_id: string;
  statut: BonCommandeStatus;
  /** Valeur de vente des articles au catalogue. Reference, jamais montant a payer. */
  montant_total: number;
  /** Ce qu'on doit a la fonderie : devis + frais annexes. Pilote le reglement. */
  montant_fonderie: number;
  frais_annexes: number;
  frais_annexes_libelle: string | null;
  date_envoi: string | null;
  date_reception: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  fonderie?: Fonderie;
  lignes?: VenteLigne[];
}
