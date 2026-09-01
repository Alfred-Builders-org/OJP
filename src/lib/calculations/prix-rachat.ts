import { estMetalPrixFixe } from "@/lib/validations/lot";

/** Returns 0 for NaN, Infinity, or negative numbers. */
function safeNum(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Tarifs au gramme des matieres qui ne suivent aucun cours. */
export interface TarifsFixes {
  plaqueOr: number;
  plaqueArgent: number;
  autre: number;
}

export const TARIFS_FIXES_DEFAUT: TarifsFixes = {
  plaqueOr: 0.07,
  plaqueArgent: 0.01,
  autre: 0.01,
};

/**
 * Calcul du prix de rachat pour les bijoux.
 *
 * Formule : cours_metal × (qualite / 1000) × poids × coefficient_rachat
 *
 * @param coursMetalGramme - Prix du gramme du métal pur (snapshot)
 * @param qualite - Pureté en millièmes (ex: 750 pour 18k)
 * @param poids - Poids en grammes
 * @param coefficientRachat - Coefficient de marge (ex: 0.85)
 */
export function calculerPrixRachatBijoux(
  coursMetalGramme: number,
  qualite: number,
  poids: number,
  coefficientRachat: number
): number {
  return Math.round(safeNum(coursMetalGramme) * (safeNum(qualite) / 1000) * safeNum(poids) * safeNum(coefficientRachat) * 100) / 100;
}

/**
 * Prix d'une matiere a tarif fixe : tarif au gramme × poids.
 *
 * Ni titrage ni coefficient n'entrent en jeu. Le titrage n'a pas de sens sur du
 * plaque — c'est une couche de metal precieux sur un support qui n'en est pas —
 * et le tarif que la boutique affiche est deja son prix de reprise : lui
 * appliquer en plus le coefficient de rachat le diviserait une seconde fois.
 */
export function calculerPrixMatiereFixe(
  tarifGramme: number,
  poids: number
): number {
  return Math.round(safeNum(tarifGramme) * safeNum(poids) * 100) / 100;
}

/** Tarif au gramme applicable a une matiere sans cours. */
export function tarifFixePourMetal(
  metal: string | null | undefined,
  tarifs: TarifsFixes
): number {
  switch (metal) {
    case "Plaque or":
      return tarifs.plaqueOr;
    case "Plaque argent":
      return tarifs.plaqueArgent;
    case "Autre":
      return tarifs.autre;
    default:
      return 0;
  }
}

/**
 * Prix de reprise d'un bijou, quelle que soit sa matiere.
 *
 * Aiguille vers le calcul au cours ou vers le tarif fixe : c'est le seul point
 * ou la distinction doit etre faite, pour que les formulaires n'aient pas a la
 * refaire chacun de leur cote.
 */
export function calculerPrixBijou({
  metal,
  coursMetalGramme,
  qualite,
  poids,
  coefficient,
  tarifs,
}: {
  metal: string | null | undefined;
  coursMetalGramme: number;
  qualite: number;
  poids: number;
  coefficient: number;
  tarifs: TarifsFixes;
}): number {
  if (estMetalPrixFixe(metal)) {
    return calculerPrixMatiereFixe(tarifFixePourMetal(metal, tarifs), poids);
  }
  return calculerPrixRachatBijoux(coursMetalGramme, qualite, poids, coefficient);
}

/**
 * Calcul du prix de rachat pour l'or investissement.
 *
 * Formule : cours_metal × poids × coefficient
 *
 * @param coursMetalGramme - Prix du gramme du métal pur (snapshot)
 * @param poids - Poids en grammes (du catalogue)
 * @param coefficient - Coefficient d'achat (global ou spécifique)
 */
export function calculerPrixRachatOrInvest(
  coursMetalGramme: number,
  poids: number,
  coefficient: number
): number {
  return Math.round(safeNum(coursMetalGramme) * safeNum(poids) * safeNum(coefficient) * 100) / 100;
}

/**
 * Retourne le cours du métal approprié depuis les snapshots du lot.
 *
 * Les matieres a tarif fixe n'ont pas de cours : elles renvoient 0, et leur prix
 * passe par `calculerPrixMatiereFixe`.
 */
export function getCoursMetalFromSnapshot(
  metal: string,
  coursOrSnapshot: number,
  coursArgentSnapshot: number,
  coursPlatineSnapshot: number
): number {
  switch (metal) {
    case "Or":
      return coursOrSnapshot;
    case "Argent":
      return coursArgentSnapshot;
    case "Platine":
      return coursPlatineSnapshot;
    default:
      return 0;
  }
}
