import type { RegimeTVARevente } from "@/lib/calculations/taxes";

export type { RegimeTVARevente };

export interface BijouxStock {
  id: string;
  nom: string;
  description: string | null;
  photo_url: string | null;
  statut: "en_stock" | "vendu" | "reserve" | "en_depot_vente" | "rendu_client" | "en_reparation" | "fondu" | "a_fondre";
  poids: number | null;
  poids_brut: number | null;
  poids_net: number | null;
  quantite: number | null;
  titrage: string | null;
  metaux: "Or" | "Platine" | "Argent" | "Autre" | null;
  qualite: "333" | "375" | "585" | "750" | "999" | null;
  /** Ce qui est sorti de la caisse pour l'acquerir, taxe comprise. */
  prix_achat: number | null;
  /** Prix d'achat hors taxe, quand le vendeur etait assujetti. */
  prix_achat_ht: number | null;
  /** Taux porte par la facture d'achat, en pourcentage. NULL si elle n'en portait pas. */
  tva_achat_taux: number | null;
  /** TVA deductible sur l'achat. */
  tva_achat_montant: number;
  /**
   * Le regime sous lequel l'article se revend. Il ne depend pas du bijou mais
   * de qui l'a vendu a la boutique : marge pour un particulier ou un vendeur
   * qui applique lui-meme le 297 A, normal pour un assujetti qui a facture
   * sa TVA.
   */
  regime_tva_revente: RegimeTVARevente;
  prix_revente: number | null;
  depot_vente_lot_id: string | null;
  deposant_client_id: string | null;
  grossiste_id: string | null;
  achat_grossiste_id: string | null;
  reference_fournisseur: string | null;
  /** Reference de l'article, heritee de la reference du lot d'origine. */
  reference: string | null;
  date_creation: string;
  created_at: string;
  updated_at: string;
}

export interface Reparation {
  id: string;
  bijou_id: string;
  description: string | null;
  cout_estime: number | null;
  cout_reel: number | null;
  notes: string | null;
  date_envoi: string;
  date_retour: string | null;
  statut: "en_cours" | "terminee";
  created_at: string;
  updated_at: string;
}

export interface BijouxStockWithOrigin extends BijouxStock {
  /** Le vendeur pour un rachat ou un depot-vente, le grossiste pour un achat. */
  origin_client_name: string | null;
  origin_type: "rachat" | "depot_vente" | "grossiste" | null;
}

export interface StockOrigin {
  type: "rachat" | "depot_vente";
  reference?: {
    id: string;
    designation: string;
    prix_achat: number | null;
    status: string;
  };
  lot: {
    id: string;
    numero: string;
    type: string;
    status: string;
    date_finalisation: string | null;
    created_at: string;
  };
  dossier: {
    id: string;
    numero: string;
  };
  client: {
    id: string;
    civility: string;
    first_name: string;
    last_name: string;
  };
}

/** La provenance d'un bijou neuf : l'achat par lequel il est entre en boutique. */
export interface StockOriginGrossiste {
  grossiste: { id: string; nom: string };
  achat: { id: string; numero: string; date_achat: string; numero_facture: string | null } | null;
}

export interface StockSale {
  ligne: {
    id: string;
    prix_total: number | null;
    is_livre: boolean;
  };
  lot: {
    id: string;
    numero: string;
    status: string;
    date_livraison: string | null;
    created_at: string;
  };
  dossier: {
    id: string;
    numero: string;
  };
  client: {
    id: string;
    civility: string;
    first_name: string;
    last_name: string;
  };
}
