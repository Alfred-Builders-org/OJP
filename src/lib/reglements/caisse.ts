import type { ModeReglement, ReglementSens, ReglementType } from "@/types/reglement";

/**
 * La feuille de caisse du jour.
 *
 * Elle reproduit le classeur que la boutique tient a la main depuis l'ouverture :
 * une ligne par mouvement, deux blocs de colonnes — ce que les clients versent
 * (« ils achetent ») et ce que la boutique verse (« j'achete ») — et les
 * reparations a part, parce qu'elles ne sont ni un rachat ni une vente.
 *
 * Le classeur ne connait que quatre moyens de paiement, exactement ceux que
 * porte la table des reglements. Rien n'est donc a traduire : chaque reglement
 * tombe dans une case et une seule.
 */

/**
 * Les colonnes de la feuille.
 *
 * Deux blocs de quatre modes de paiement, un de chaque côté : ce qui rentre, ce
 * qui sort. Les réparations ne sont plus une colonne à part — c'est un règlement
 * comme un autre, qui tombe dans son mode côté encaissements.
 */
export type ColonneCaisse =
  | "entrant_especes"
  | "entrant_carte"
  | "entrant_virement"
  | "entrant_cheque"
  | "sortant_especes"
  | "sortant_carte"
  | "sortant_virement"
  | "sortant_cheque";

export const COLONNES_ENTRANTES: ColonneCaisse[] = [
  "entrant_especes",
  "entrant_carte",
  "entrant_virement",
  "entrant_cheque",
];

export const COLONNES_SORTANTES: ColonneCaisse[] = [
  "sortant_especes",
  "sortant_carte",
  "sortant_virement",
  "sortant_cheque",
];

export const LIBELLES_COLONNES: Record<ColonneCaisse, string> = {
  entrant_especes: "Espèces",
  entrant_carte: "Carte",
  entrant_virement: "Virement",
  entrant_cheque: "Chèque",
  sortant_especes: "Espèces",
  sortant_carte: "Carte",
  sortant_virement: "Virement",
  sortant_cheque: "Chèque",
};

/** Un mouvement d'argent tel que la feuille le lit. */
export interface MouvementCaisse {
  id: string;
  sens: ReglementSens;
  type: ReglementType;
  mode: ModeReglement;
  montant: number;
  date_reglement: string;
  /** Numero du lot rattache, quand il y en a un. */
  numero_lot: string | null;
  /** Statut du lot rattache, pour le badge de statut. */
  lot_status: string | null;
  lot_outcome: string | null;
  /** Type du lot (rachat, vente, depot_vente, fonte). */
  lot_type: string | null;
  /** Nom du tiers de l'operation : client, grossiste ou fonderie. */
  tiers: string;
}

/** Une ligne de la feuille : un mouvement, ventile dans sa colonne. */
export interface LigneCaisse extends MouvementCaisse {
  colonne: ColonneCaisse;
}

export type TotauxCaisse = Record<ColonneCaisse, number>;

/**
 * Où tombe un mouvement : à son sens et à son mode de paiement, sans exception.
 * Une réparation encaissée en carte tombe en carte, un rachat payé en virement
 * tombe en virement sortant.
 */
export function colonnePourMouvement(
  mouvement: Pick<MouvementCaisse, "sens" | "mode">
): ColonneCaisse {
  return `${mouvement.sens}_${mouvement.mode}` as ColonneCaisse;
}

/** Ventile les mouvements du jour dans les colonnes de la feuille. */
export function ventiler(mouvements: MouvementCaisse[]): LigneCaisse[] {
  return mouvements.map((m) => ({ ...m, colonne: colonnePourMouvement(m) }));
}

function totauxVides(): TotauxCaisse {
  return {
    entrant_especes: 0,
    entrant_carte: 0,
    entrant_virement: 0,
    entrant_cheque: 0,
    sortant_especes: 0,
    sortant_carte: 0,
    sortant_virement: 0,
    sortant_cheque: 0,
  };
}

/**
 * Les totaux du pied de feuille.
 *
 * Les montants s'additionnent tels qu'ils sont enregistres, signe compris : un
 * remboursement est un reglement negatif (R-015), et il doit diminuer la
 * colonne ou il tombe plutot que de la gonfler. Le classeur fait de meme — on y
 * lit « rbt puzols dble virement −461 ».
 */
export function totaliser(lignes: LigneCaisse[]): TotauxCaisse {
  const totaux = totauxVides();
  for (const ligne of lignes) {
    totaux[ligne.colonne] += ligne.montant;
  }
  return totaux;
}

/** Ce que les clients ont versé dans la journée. */
export function totalEntrant(totaux: TotauxCaisse): number {
  return COLONNES_ENTRANTES.reduce((somme, colonne) => somme + totaux[colonne], 0);
}

/** Total de la ligne d'un mouvement : sa colonne remplie, les autres vides. */
export function totalLigne(ligne: LigneCaisse, sens: ReglementSens): number {
  return ligne.sens === sens ? ligne.montant : 0;
}

/** Ce que la boutique a verse dans la journee. */
export function totalSortant(totaux: TotauxCaisse): number {
  return COLONNES_SORTANTES.reduce((somme, colonne) => somme + totaux[colonne], 0);
}

/**
 * Le solde de la journee : ce qui est entre moins ce qui est sorti.
 *
 * Ce n'est pas un resultat comptable — un rachat sort de l'argent mais fait
 * entrer de la marchandise. C'est le mouvement net de la caisse, celui qu'on
 * verifie le soir en comptant le tiroir.
 */
export function solde(totaux: TotauxCaisse): number {
  return totalEntrant(totaux) - totalSortant(totaux);
}

/** Bornes d'un jour, en heure locale, pour interroger la base. */
export function bornesDuJour(jour: string): { debut: string; fin: string } {
  const debut = new Date(`${jour}T00:00:00`);
  const fin = new Date(`${jour}T00:00:00`);
  fin.setDate(fin.getDate() + 1);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}
