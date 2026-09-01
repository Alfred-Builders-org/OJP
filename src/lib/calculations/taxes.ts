/** Returns 0 for NaN, Infinity, or negative numbers. */
function safeNum(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Calcul de la TMP (Taxe sur les Métaux Précieux).
 * Taux fixe de 11.5% sur le montant total de la transaction.
 * Toujours applicable, sans condition.
 */
export function calculerTMP(prixAchat: number): number {
  return Math.round(safeNum(prixAchat) * 0.115 * 100) / 100;
}

/**
 * Vérifie l'éligibilité à la TPV (Taxe sur la Plus-Value).
 * Conditions requises : facture au nom du client + scellés intacts + date d'acquisition + prix d'acquisition.
 */
export function isTPVEligible(
  hasFacture: boolean,
  isScelle: boolean,
  dateAcquisition: string | null,
  prixAcquisition: number | null
): boolean {
  return (
    hasFacture &&
    isScelle &&
    dateAcquisition !== null &&
    dateAcquisition !== "" &&
    prixAcquisition !== null &&
    prixAcquisition > 0
  );
}

/**
 * Calcul de la TPV (Taxe sur la Plus-Value).
 *
 * - Base : plus-value = prix_achat - prix_acquisition
 * - Si plus-value <= 0 : pas de taxe
 * - Si détention >= 22 ans : exonération totale
 * - Sinon : taux dégressif avec abattement à partir de la 3e année
 *   - IR : 19% avec abattement de 5%/an après la 2e année
 *   - Prélèvements sociaux : 17.2% avec abattement de 1.6%/an après la 2e année
 *
 * @param prixAchat - Prix de rachat proposé
 * @param prixAcquisition - Prix d'acquisition original
 * @param dateAcquisition - Date d'acquisition (ISO string)
 */
export function calculerTPV(
  prixAchat: number,
  prixAcquisition: number,
  dateAcquisition: string
): number {
  const plusValue = safeNum(prixAchat) - safeNum(prixAcquisition);
  if (plusValue <= 0) return 0;

  const acq = new Date(dateAcquisition);
  if (isNaN(acq.getTime())) return 0;
  const now = new Date();
  let years = now.getFullYear() - acq.getFullYear();
  if (
    now.getMonth() < acq.getMonth() ||
    (now.getMonth() === acq.getMonth() && now.getDate() < acq.getDate())
  ) {
    years--;
  }

  if (years >= 22) return 0;

  let abatementIR = 0;
  let abatementSocial = 0;

  if (years > 2) {
    abatementIR = Math.min((years - 2) * 5, 100);
    abatementSocial = Math.min((years - 2) * 1.6, 100);
  }

  const tauxIR = 0.19 * (1 - abatementIR / 100);
  const tauxSocial = 0.172 * (1 - abatementSocial / 100);

  const montantIR = Math.round(plusValue * tauxIR * 100) / 100;
  const montantSocial = Math.round(plusValue * tauxSocial * 100) / 100;
  return montantIR + montantSocial;
}

/**
 * Calcul de la TFOP (Taxe Forfaitaire sur les Objets Précieux).
 * Taux fixe de 6% + 0.5% CRDS = 6.5% sur le montant total de la cession.
 * Exonéré si le montant de cession est ≤ 5 000 €.
 */
export function calculerTFOP(prixCession: number): number {
  const prix = safeNum(prixCession);
  if (prix <= 5000) return 0;
  return Math.round(prix * 0.065 * 100) / 100;
}

/** Taux de TVA de droit commun, en pourcentage. */
export const TAUX_TVA_NORMAL = 20;

/** Mention obligatoire sur une facture soumise au regime des biens d'occasion. */
export const MENTION_TVA_MARGE =
  "Regime particulier des biens d'occasion - article 297 A du CGI. TVA non recuperable par l'acquereur.";

/** Arrondi au centime, sur un montant deja valide. */
function auCentime(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Extrait la TVA contenue dans un prix toutes taxes comprises.
 *
 * Un prix de vitrine est TTC : la taxe s'en retire, elle ne s'y ajoute pas.
 * A 20 %, c'est 20/120 du prix, et non 20 % de celui-ci.
 */
export function tvaIncluse(prixTTC: number, taux: number = TAUX_TVA_NORMAL): number {
  const prix = safeNum(prixTTC);
  const t = safeNum(taux);
  if (prix <= 0 || t <= 0) return 0;
  return auCentime((prix * t) / (100 + t));
}

/**
 * TVA sur la marge (regime des biens d'occasion, art. 297 A du CGI).
 *
 * La marge est TTC : le prix de vente affiche au client contient deja la taxe.
 * On l'en extrait donc avec 20/120, et non en ajoutant 20 % par-dessus — ce que
 * faisait le calcul precedent, qui surevaluait la TVA d'un cinquieme. Sur une
 * vente a 1 000 EUR pour un achat a 700 EUR : 300 x 20/120 = 50 EUR, et non 60.
 *
 * Marge nulle ou negative : pas de TVA. Et, en methode bijou par bijou, cette
 * perte ne s'impute sur la marge d'aucun autre article : elle est simplement
 * perdue. C'est ce que corrige la globalisation, voir construireRegistreMarge().
 */
export function calculerTVAMarge(
  prixVente: number,
  prixAchat: number,
  taux: number = TAUX_TVA_NORMAL
): number {
  const marge = safeNum(prixVente) - safeNum(prixAchat);
  if (marge <= 0) return 0;
  return tvaIncluse(marge, taux);
}

/**
 * Le regime de TVA sous lequel un article se revend.
 *
 * - `marge` : achete a un particulier ou a un non-assujetti. La TVA ne porte que
 *   sur la marge, la facture ne la ventile pas, le client ne recupere rien.
 * - `normal` : achete a un professionnel assujetti qui a facture sa TVA. Elle
 *   porte alors sur le prix total, et se deduit de celle de l'achat.
 */
export type RegimeTVARevente = "marge" | "normal";

/**
 * Le regime effectivement applique a une vente.
 *
 * Le regime de la marge n'est pas obligatoire : sur n'importe quelle vente, on
 * peut y renoncer et facturer la TVA sur le prix entier (art. 297 C du CGI).
 * Cela n'a d'interet que si l'acheteur est un professionnel qui veut la
 * recuperer — le vendeur, lui, y perd. L'inverse n'existe pas : un bien qui
 * n'a jamais releve de la marge ne peut pas y entrer.
 */
export function regimeVenteEffectif(
  regimeArticle: RegimeTVARevente,
  optionPrixTotal = false
): RegimeTVARevente {
  return optionPrixTotal ? "normal" : regimeArticle;
}

export interface TaxeLigneVente {
  regime: RegimeTVARevente;
  typeTaxe: "tva_marge" | "tva_normale" | null;
  taux: number;
  /** Ce sur quoi la TVA se calcule : la marge, ou le prix entier. */
  base: number;
  montantTVA: number;
  /** Le prix affiche au client. La TVA y est comprise, jamais ajoutee. */
  prixTTC: number;
}

/**
 * La taxe d'une ligne de vente, quel que soit son regime.
 *
 * Point commun aux deux regimes : le prix de vente est celui de l'etiquette, et
 * la TVA s'y trouve deja. Ce qui change, c'est l'assiette — la marge d'un cote,
 * le prix entier de l'autre — et ce que la facture en montre.
 *
 * Les frais de remise en etat (polissage, fermoir) n'entrent pas ici : ils ne
 * s'ajoutent pas au prix d'achat pour le calcul de la marge. Leur propre TVA se
 * recupere a part, sur la facture du reparateur.
 */
export function calculerTaxeVente(params: {
  prixVenteTTC: number;
  prixAchat: number;
  regimeArticle: RegimeTVARevente;
  optionPrixTotal?: boolean;
  taux?: number;
}): TaxeLigneVente {
  const taux = safeNum(params.taux ?? TAUX_TVA_NORMAL);
  const prixTTC = safeNum(params.prixVenteTTC);
  const regime = regimeVenteEffectif(params.regimeArticle, params.optionPrixTotal);

  if (regime === "normal") {
    const montantTVA = tvaIncluse(prixTTC, taux);
    return {
      regime,
      typeTaxe: montantTVA > 0 ? "tva_normale" : null,
      taux,
      base: prixTTC,
      montantTVA,
      prixTTC,
    };
  }

  const marge = Math.max(0, prixTTC - safeNum(params.prixAchat));
  const montantTVA = tvaIncluse(marge, taux);
  return {
    regime,
    typeTaxe: montantTVA > 0 ? "tva_marge" : null,
    taux,
    base: marge,
    montantTVA,
    prixTTC,
  };
}

/**
 * Compare TPV et TMP et retourne le régime le plus avantageux (le moins cher).
 */
export function regimeFiscalOptimal(
  tpvMontant: number | null,
  tmpMontant: number
): { regime: "TPV" | "TMP"; montant: number } {
  if (tpvMontant !== null && tpvMontant < tmpMontant) {
    return { regime: "TPV", montant: tpvMontant };
  }
  return { regime: "TMP", montant: tmpMontant };
}

/**
 * Compare TPV et TFOP et retourne le régime le plus avantageux (le moins cher).
 * Utilisé pour les bijoux (TFOP au lieu de TMP).
 */
export function regimeFiscalOptimalBijoux(
  tpvMontant: number | null,
  tfopMontant: number
): { regime: "TPV" | "TFOP"; montant: number } {
  if (tpvMontant !== null && tpvMontant < tfopMontant) {
    return { regime: "TPV", montant: tpvMontant };
  }
  return { regime: "TFOP", montant: tfopMontant };
}
