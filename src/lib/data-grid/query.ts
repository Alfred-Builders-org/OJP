/**
 * Traduction des paramètres d'URL d'un tableau en requête Supabase.
 *
 * Le filtrage et le tri s'appliquaient jusqu'ici en mémoire, sur les seules
 * lignes déjà chargées — c'est-à-dire la page affichée. Chercher un client
 * absent de la première page ne renvoyait rien, trier « Prix » ne triait que
 * vingt lignes, et le compteur de pagination annonçait le total de la base
 * pendant que le corps du tableau montrait un sous-ensemble filtré.
 *
 * En descendant ces paramètres dans la requête, la recherche porte sur
 * l'ensemble des données et le compteur redevient exact.
 */

export interface ParamsTableau {
  page?: string;
  size?: string;
  q?: string;
  tri?: string;
  sens?: string;
  groupe?: string;
  [cle: string]: string | undefined;
}

export interface OptionsRequete {
  /** Colonnes balayées par la recherche plein texte. */
  colonnesRecherche: readonly string[];
  /** Colonnes filtrables : clé d'URL -> colonne en base. */
  colonnesFiltres?: Record<string, string>;
  /** Colonnes triables : clé d'URL -> colonne en base. */
  colonnesTri?: Record<string, string>;
  /** Tri appliqué quand l'URL n'en demande aucun. */
  triParDefaut?: { colonne: string; ascendant: boolean };
  tailleParDefaut?: number;
}

export interface EtatTableau {
  page: number;
  size: number;
  from: number;
  to: number;
  search: string;
  filtres: Record<string, string[]>;
  tri: string | null;
  ascendant: boolean;
}

/** Lit et normalise les paramètres d'URL. */
export function lireParams(
  params: ParamsTableau,
  tailleParDefaut = 20
): EtatTableau {
  const page = Math.max(0, parseInt(params.page ?? "0") || 0);
  const size = Math.max(1, parseInt(params.size ?? String(tailleParDefaut)) || tailleParDefaut);

  const filtres: Record<string, string[]> = {};
  for (const [cle, valeur] of Object.entries(params)) {
    if (cle.startsWith("f_") && valeur) {
      filtres[cle.slice(2)] = valeur.split(",").filter(Boolean);
    }
  }

  return {
    page,
    size,
    from: page * size,
    to: page * size + size - 1,
    search: params.q?.trim() ?? "",
    filtres,
    tri: params.tri ?? null,
    ascendant: params.sens !== "desc",
  };
}

/**
 * Clause de recherche pour les entités rattachées à un client.
 *
 * PostgREST ne sait pas mélanger, dans un même OU, une colonne de la table et
 * une colonne d'une table jointe. On résout donc d'abord les clients dont le nom
 * correspond, puis on élargit la clause à leurs identifiants — ce qui permet de
 * chercher un lot ou un dossier aussi bien par son numéro que par son client.
 *
 * @param colonneClient colonne de rattachement (`client_id`, `dossier_id`…)
 * @param ids identifiants déjà résolus
 */
export function clauseAvecClient(
  terme: string,
  colonneRecherche: string,
  colonneClient: string,
  ids: string[]
): string {
  const propre = terme.replace(/[(),]/g, " ").trim();
  const base = `${colonneRecherche}.ilike.%${propre}%`;
  return ids.length ? `${base},${colonneClient}.in.(${ids.join(",")})` : base;
}

/**
 * Applique recherche, filtres et tri à une requête Supabase.
 *
 * Le type est volontairement large : les constructeurs de requête Supabase sont
 * chaînables mais leurs types varient selon les étapes déjà appliquées, et les
 * contraindre ici obligerait chaque page à des acrobaties de typage sans
 * bénéfice réel.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appliquerFiltres<T extends { or: any; in: any; order: any }>(
  requete: T,
  etat: EtatTableau,
  options: OptionsRequete
): T {
  let q = requete;

  if (etat.search) {
    // `ilike` sur chaque colonne, réunies en OU. Les virgules et parenthèses
    // sont des séparateurs dans la syntaxe PostgREST : on les neutralise.
    const terme = etat.search.replace(/[(),]/g, " ").trim();
    if (terme) {
      const clauses = options.colonnesRecherche
        .map((col) => `${col}.ilike.%${terme}%`)
        .join(",");
      q = q.or(clauses);
    }
  }

  for (const [cle, valeurs] of Object.entries(etat.filtres)) {
    const colonne = options.colonnesFiltres?.[cle];
    if (colonne && valeurs.length) {
      q = q.in(colonne, valeurs);
    }
  }

  const colonneTri = etat.tri ? options.colonnesTri?.[etat.tri] : null;
  if (colonneTri) {
    q = q.order(colonneTri, { ascending: etat.ascendant });
  } else if (options.triParDefaut) {
    q = q.order(options.triParDefaut.colonne, {
      ascending: options.triParDefaut.ascendant,
    });
  }

  return q;
}
