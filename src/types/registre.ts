/**
 * Une inscription au registre des objets mobiliers (livre de police).
 *
 * Les mentions suivent l'article R321-3 du code pénal. Elles sont figées à
 * l'entrée de l'objet : corriger la fiche d'un client plus tard ne réécrit pas
 * ce qui a été inscrit, sans quoi le registre perdrait toute valeur probante.
 */
export interface RegistreObjet {
  id: string;
  /** Numéro d'ordre continu. Une rupture de séquence se voit. */
  numero_ordre: number;
  date_entree: string;

  // Identité du cédant
  cedant_nom: string;
  cedant_prenoms: string | null;
  cedant_qualite: string | null;
  cedant_domicile: string | null;
  piece_nature: string | null;
  piece_numero: string | null;
  piece_autorite: string | null;
  piece_date_delivrance: string | null;

  // Objet
  objet_nature: string;
  objet_description: string | null;
  objet_provenance: string;
  objet_metal: string | null;
  objet_titrage: string | null;
  objet_poids: number | null;
  objet_quantite: number | null;
  prix: number | null;

  reference: string | null;
  lot_reference_id: string | null;
  client_id: string | null;
  created_at: string;
}
