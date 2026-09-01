import { TAUX_TVA_NORMAL, calculerTVAMarge, tvaIncluse } from "./taxes";

/**
 * Le registre des ventes sous le regime de la marge, periode par periode.
 *
 * Il existe deux facons de calculer la TVA due sur ces ventes, et le choix
 * entre les deux se fait avec le comptable :
 *
 * - **Bijou par bijou** : on taxe la marge de chaque article. C'est ce que fait
 *   l'application au moment de facturer, et c'est ce que porte chaque facture.
 *   Une vente a perte ne rapporte pas de TVA, mais sa perte ne s'impute sur
 *   aucune autre vente : elle disparait.
 * - **Globalisation** : on taxe la difference entre le total des ventes et le
 *   total des achats de la periode. Une periode negative ne s'annule pas, elle
 *   se reporte sur la suivante. C'est souvent plus favorable a une vitrine qui
 *   tourne beaucoup, mais cela suppose de tenir le registre des achats de la
 *   periode, et non des seuls articles vendus.
 *
 * Ce module ne tranche pas : il calcule les deux et les met en regard.
 */

export type GranulariteMarge = "mois" | "trimestre";

/** Une vente passee sous le regime de la marge. */
export interface VenteSousMarge {
  id: string;
  /** Date d'emission de la facture, en ISO. */
  date: string;
  reference: string;
  designation: string;
  /** Prix paye par le client, taxe comprise. */
  prixVente: number;
  /** Prix d'achat du bien, tel que fige au moment de la vente. */
  prixAchat: number;
}

/**
 * Un achat entre en stock sous le regime de la marge — c'est-a-dire acquis
 * aupres d'un particulier ou d'un non-assujetti. La globalisation les compte
 * tous, y compris ceux qui ne sont pas encore revendus.
 */
export interface AchatSousMarge {
  id: string;
  date: string;
  designation: string;
  prixAchat: number;
}

export interface PeriodeMarge {
  cle: string;
  libelle: string;
  nbVentes: number;
  nbAchats: number;
  /** Total encaisse sur les ventes de la periode, taxe comprise. */
  totalVentes: number;
  /** Total des achats entres en stock sur la periode. */
  totalAchats: number;

  // Methode bijou par bijou
  /** Somme des seules marges positives : les pertes ne se compensent pas. */
  margeDetaillee: number;
  tvaDetaillee: number;
  /** Nombre de ventes a perte, et le montant que la methode laisse tomber. */
  nbVentesAPerte: number;
  perteNonImputee: number;

  // Methode de la globalisation
  /** Ventes moins achats de la periode, avant report. */
  margeGlobaleBrute: number;
  /** Solde negatif herite de la periode precedente (negatif ou nul). */
  reportEntrant: number;
  /** Ce qui est effectivement taxe apres imputation du report. */
  margeGlobaleTaxable: number;
  tvaGlobalisee: number;
  /** Solde negatif transmis a la periode suivante (negatif ou nul). */
  reportSortant: number;
}

function auCentime(n: number): number {
  return Math.round(n * 100) / 100;
}

const MOIS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

/**
 * La periode a laquelle une date appartient. La cle est triable en ordre
 * lexicographique, ce qui suffit a ranger les periodes dans le temps.
 */
export function periodeDe(
  dateISO: string,
  granularite: GranulariteMarge
): { cle: string; libelle: string } | null {
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return null;
  const annee = d.getFullYear();

  if (granularite === "trimestre") {
    const t = Math.floor(d.getMonth() / 3) + 1;
    return {
      cle: `${annee}-T${t}`,
      libelle: `${t}${t === 1 ? "er" : "e"} trimestre ${annee}`,
    };
  }

  const mois = d.getMonth();
  return {
    cle: `${annee}-${String(mois + 1).padStart(2, "0")}`,
    libelle: `${MOIS[mois]} ${annee}`,
  };
}

/**
 * Construit le registre, une ligne par periode, de la plus ancienne a la plus
 * recente. Le report de la globalisation traverse les periodes dans cet ordre :
 * il ne se calcule donc pas periode par periode isolement.
 *
 * Les periodes sans mouvement ne sont pas creees, mais un report les traverse
 * intact — il ne s'eteint qu'en s'imputant sur une marge positive.
 */
export function construireRegistreMarge(params: {
  ventes: VenteSousMarge[];
  achats: AchatSousMarge[];
  granularite: GranulariteMarge;
  taux?: number;
}): PeriodeMarge[] {
  const taux = params.taux ?? TAUX_TVA_NORMAL;
  const parCle = new Map<
    string,
    { libelle: string; ventes: VenteSousMarge[]; achats: AchatSousMarge[] }
  >();

  function seau(dateISO: string) {
    const p = periodeDe(dateISO, params.granularite);
    if (!p) return null;
    let entree = parCle.get(p.cle);
    if (!entree) {
      entree = { libelle: p.libelle, ventes: [], achats: [] };
      parCle.set(p.cle, entree);
    }
    return entree;
  }

  for (const v of params.ventes) seau(v.date)?.ventes.push(v);
  for (const a of params.achats) seau(a.date)?.achats.push(a);

  const cles = [...parCle.keys()].sort();
  const registre: PeriodeMarge[] = [];
  let report = 0;

  for (const cle of cles) {
    const { libelle, ventes, achats } = parCle.get(cle)!;

    const totalVentes = auCentime(ventes.reduce((s, v) => s + v.prixVente, 0));
    const totalAchats = auCentime(achats.reduce((s, a) => s + a.prixAchat, 0));

    let margeDetaillee = 0;
    let tvaDetaillee = 0;
    let nbVentesAPerte = 0;
    let perteNonImputee = 0;

    for (const v of ventes) {
      const marge = v.prixVente - v.prixAchat;
      if (marge > 0) {
        margeDetaillee += marge;
        tvaDetaillee += calculerTVAMarge(v.prixVente, v.prixAchat, taux);
      } else if (marge < 0) {
        nbVentesAPerte += 1;
        perteNonImputee += -marge;
      }
    }

    const margeGlobaleBrute = auCentime(totalVentes - totalAchats);
    const soldeCumule = auCentime(margeGlobaleBrute + report);
    const margeGlobaleTaxable = soldeCumule > 0 ? soldeCumule : 0;
    const reportSortant = soldeCumule < 0 ? soldeCumule : 0;

    registre.push({
      cle,
      libelle,
      nbVentes: ventes.length,
      nbAchats: achats.length,
      totalVentes,
      totalAchats,
      margeDetaillee: auCentime(margeDetaillee),
      tvaDetaillee: auCentime(tvaDetaillee),
      nbVentesAPerte,
      perteNonImputee: auCentime(perteNonImputee),
      margeGlobaleBrute,
      reportEntrant: report,
      margeGlobaleTaxable,
      tvaGlobalisee: tvaIncluse(margeGlobaleTaxable, taux),
      reportSortant,
    });

    report = reportSortant;
  }

  return registre.reverse();
}
