export type ReparationStatut = "en_cours" | "terminee";

/**
 * Une reparation.
 *
 * Deux formes, et la difference compte : soit elle porte sur un bijou de
 * l'inventaire — `bijou_id` renseigne, l'article part et revient en stock —,
 * soit sur un objet apporte par un client, qui n'entre jamais en stock. Le
 * second cas est le plus courant au comptoir, et c'est lui qui remplit la
 * colonne « reparations » de la feuille de caisse.
 */
export interface Reparation {
  id: string;
  bijou_id: string | null;
  /** Proprietaire de l'objet apporte. Renseigne hors stock. */
  client_id: string | null;
  /** Ce qui est repare, quand l'objet n'a pas de fiche en stock. */
  designation: string | null;
  description: string | null;
  cout_estime: number | null;
  /** Ce que l'atelier facture a la boutique. */
  cout_reel: number | null;
  /** Ce que la boutique demande au client. C'est lui qui entre en caisse. */
  prix_facture: number | null;
  notes: string | null;
  date_envoi: string;
  date_retour: string | null;
  statut: ReparationStatut;
  created_at: string;
  updated_at: string;
}

/** Une reparation telle que la liste la montre, avec ses rattachements. */
export interface ReparationRow extends Reparation {
  bijou: { id: string; nom: string } | null;
  client: { id: string; first_name: string; last_name: string } | null;
  /** Somme deja encaissee sur cette reparation. */
  encaisse: number;
}
