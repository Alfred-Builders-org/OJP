/**
 * Client goldapi.io — récupération des cours des métaux précieux.
 *
 * L'application stocke les cours au gramme d'or pur (24 carats) en euros.
 * goldapi.io expose directement `price_gram_24k`, ce qui évite toute
 * conversion depuis l'once.
 *
 * Quota : le plan gratuit est limité (~100 appels/mois). Un rafraîchissement
 * consomme 3 appels, un par métal.
 */

const GOLDAPI_BASE = "https://www.goldapi.io/api";

/** Symboles goldapi des métaux suivis, mappés sur les colonnes de `parametres`. */
const METAUX = [
  { symbol: "XAU", colonne: "prix_or", label: "or" },
  { symbol: "XAG", colonne: "prix_argent", label: "argent" },
  { symbol: "XPT", colonne: "prix_platine", label: "platine" },
] as const;

export type CoursMetaux = {
  prix_or: number;
  prix_argent: number;
  prix_platine: number;
};

export type CoursResult =
  | { ok: true; cours: CoursMetaux }
  | { ok: false; erreur: string; statut: number };

interface GoldApiResponse {
  price_gram_24k?: number;
  error?: string;
}

/**
 * Interroge goldapi.io pour les trois métaux et renvoie les cours au gramme.
 *
 * Les trois appels partent en parallèle. Si l'un échoue, l'ensemble est
 * rejeté : mieux vaut ne rien écrire que d'enregistrer un cours à 0 pour un
 * métal, ce qui produirait silencieusement des prix de rachat faux.
 */
export async function recupererCours(apiKey: string): Promise<CoursResult> {
  if (!apiKey) {
    return {
      ok: false,
      statut: 500,
      erreur:
        "La clé goldapi.io n'est pas configurée. Renseignez GOLDAPI_KEY dans les variables d'environnement.",
    };
  }

  const reponses = await Promise.all(
    METAUX.map(async (metal) => {
      try {
        const res = await fetch(`${GOLDAPI_BASE}/${metal.symbol}/EUR`, {
          headers: {
            "x-access-token": apiKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          return { metal, statutHttp: res.status, prix: null };
        }

        const data = (await res.json()) as GoldApiResponse;
        const prix = data.price_gram_24k;

        if (typeof prix !== "number" || !Number.isFinite(prix) || prix <= 0) {
          return { metal, statutHttp: 502, prix: null };
        }

        return { metal, statutHttp: 200, prix };
      } catch {
        return { metal, statutHttp: 503, prix: null };
      }
    })
  );

  const echecs = reponses.filter((r) => r.prix === null);

  if (echecs.length > 0) {
    const statuts = new Set(echecs.map((e) => e.statutHttp));
    const labels = echecs.map((e) => e.metal.label).join(", ");

    if (statuts.has(401) || statuts.has(403)) {
      return {
        ok: false,
        statut: 502,
        erreur:
          "goldapi.io a refusé la connexion. La clé est peut-être invalide ou le quota mensuel est épuisé.",
      };
    }

    if (statuts.has(429)) {
      return {
        ok: false,
        statut: 429,
        erreur:
          "Trop de requêtes vers goldapi.io. Patientez quelques instants avant de réessayer.",
      };
    }

    return {
      ok: false,
      statut: 502,
      erreur: `Impossible de récupérer le cours suivant : ${labels}. Réessayez dans un instant.`,
    };
  }

  const cours = { prix_or: 0, prix_argent: 0, prix_platine: 0 };
  for (const r of reponses) {
    cours[r.metal.colonne] = arrondir(r.prix as number);
  }

  return { ok: true, cours };
}

/**
 * Les cours sont stockés en NUMERIC(10,3) depuis la migration 130 : on
 * arrondit au millième d'euro. Le centime serait trop grossier pour l'argent,
 * dont le cours au gramme avoisine 1,6 € — un arrondi à 1,64 introduirait
 * déjà 0,25 % d'erreur sur chaque rachat.
 */
function arrondir(valeur: number): number {
  return Math.round(valeur * 1000) / 1000;
}
