export type FulfillmentStatus = "pending" | "servi_stock" | "a_commander" | "commande" | "recu";

export type ModeReglement = "especes" | "carte" | "virement" | "cheque";

export interface VenteLigne {
  id: string;
  lot_id: string;
  bijoux_stock_id: string | null;
  or_investissement_id: string | null;
  designation: string;
  metal: string | null;
  qualite: string | null;
  poids: number | null;
  poids_brut: number | null;
  poids_net: number | null;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  /**
   * Prix unitaire HT facture par la fonderie, releve sur son devis. NULL tant
   * que le devis n'est pas revenu — il n'arrive qu'apres l'envoi de la commande.
   */
  prix_achat_fonderie: number | null;
  taxe_applicable: boolean;
  /** TVA comprise dans prix_total. Elle ne s'y ajoute jamais. */
  montant_taxe: number;
  type_taxe: "tva_marge" | "tva_normale" | "tfop" | null;
  /** Taux applique, en pourcentage. */
  taux_tva: number | null;
  /**
   * Prix d'achat du bien fige au moment de la vente : le registre de marge s'y
   * adosse, il ne doit pas bouger si la fiche stock est corrigee plus tard.
   */
  prix_achat_origine: number | null;
  /**
   * Renonciation volontaire au regime de la marge sur cette vente (art. 297 C
   * du CGI), a distinguer d'un bien qui n'y a jamais eu droit.
   */
  option_tva_prix_total: boolean;
  fulfillment: FulfillmentStatus;
  fonderie_id: string | null;
  bon_commande_id: string | null;
  cout_reparation: number;
  is_livre: boolean;
  created_at: string;
  updated_at: string;
}

export interface Facture {
  id: string;
  numero: string;
  lot_id: string;
  client_id: string;
  montant_ht: number;
  montant_taxe: number;
  montant_ttc: number;
  date_emission: string;
  created_at: string;
}
