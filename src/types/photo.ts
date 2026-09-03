/** Une photo de la galerie d'un lot ou d'une de ses references. */
export interface LotPhoto {
  id: string;
  lot_id: string;
  /** Vide : la photo porte sur le lot entier. */
  reference_id: string | null;
  /** Chemin dans le bucket, pas une URL : les URL signees expirent. */
  chemin: string;
  bucket: string;
  rang: number;
  created_by: string | null;
  created_at: string;
}

/** Session de prise de vue ouverte pour un telephone. */
export interface PhotoSession {
  id: string;
  token: string;
  prefixe: string;
  bucket: string;
  lot_id: string | null;
  reference_id: string | null;
  libelle: string | null;
  expire_at: string;
  created_by: string | null;
  created_at: string;
}

/** Nombre de photos qu'une seule session accepte. */
export const PHOTOS_MAX_PAR_SESSION = 20;

/** Poids maximal d'une photo, en octets. Une photo de telephone tient dessous. */
export const PHOTO_TAILLE_MAX = 12 * 1024 * 1024;

/** Duree de vie d'une session de prise de vue, en minutes. */
export const SESSION_DUREE_MINUTES = 30;

/**
 * Duree d'une session de piece d'identite.
 *
 * Plus courte que les autres, et pour une raison precise : le jeton n'est pas
 * authentifie, et celui-ci ouvre un depot vers un bucket PRIVE (R-025). Deux
 * cliches, recto et verso, se prennent en une minute — le jeton n'a aucune
 * raison de survivre a la demi-heure d'une seance photo de bijoux.
 */
export const SESSION_DUREE_MINUTES_IDENTITE = 10;

/** Une photo de la galerie d'une piece d'identite. */
export interface IdentityDocumentPhoto {
  id: string;
  document_id: string;
  chemin: string;
  bucket: string;
  rang: number;
  created_by: string | null;
  created_at: string;
}
