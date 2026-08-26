/**
 * Shared helpers for dashboard server components.
 */

// Type helpers for Supabase joined data
export type JoinedClient = {
  id: string;
  civility: string;
  first_name: string;
  last_name: string;
};
export type JoinedDossier = {
  id: string;
  numero: string;
  client: JoinedClient;
};

export function clientName(
  client: {
    civility?: string;
    first_name?: string;
    last_name?: string;
  } | null,
) {
  if (!client) return "\u2014";
  const civ = client.civility === "M" ? "M." : "Mme";
  return `${civ} ${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
}

export function extractDossier(raw: unknown): JoinedDossier | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw as JoinedDossier;
}

export function extractClient(raw: unknown): JoinedClient | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw as JoinedClient;
}

/**
 * Issues d'un lot qui closent l'opération sans qu'aucune somme ne soit due.
 *
 * Un lot rétracté ou dont le devis a été refusé est marqué `finalise` comme un
 * lot mené à son terme : seul `outcome` les distingue. Filtrer sur le seul
 * statut fait réclamer un paiement pour une marchandise que la boutique n'a
 * jamais acquise.
 */
export const OUTCOMES_SANS_SUITE = ["retracte", "refuse", "annule"] as const;

/** Vrai si le lot a bien donné lieu à une opération, donc à un mouvement d'argent. */
export function isOperationAboutie(outcome: string | null | undefined): boolean {
  if (outcome === null || outcome === undefined) return true;
  return !(OUTCOMES_SANS_SUITE as readonly string[]).includes(outcome);
}

/**
 * Filtre PostgREST équivalent à `isOperationAboutie`.
 *
 * `.not("outcome", "in", ...)` ne convient pas : en SQL, `NULL IN (…)` vaut
 * NULL, ce qui écarterait aussi les lots antérieurs à l'introduction de la
 * colonne.
 */
export const FILTRE_OPERATION_ABOUTIE = `outcome.is.null,outcome.not.in.(${OUTCOMES_SANS_SUITE.join(
  ",",
)})`;

/** Safe query wrapper: prevents a single failure from crashing the whole dashboard */
export const safe = <T,>(
  promise: PromiseLike<{ data: T | null; error: unknown }>,
) =>
  promise.then(
    (res) => ({ data: res.data, error: res.error }),
    () => ({ data: null as T | null, error: "network" as unknown }),
  );
