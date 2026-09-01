"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface DataGridState {
  /** Terme de recherche plein texte. */
  search: string;
  /** Filtres actifs : clé de colonne -> valeurs retenues. */
  filters: Record<string, string[]>;
  /** Colonne de tri, ou `null` pour l'ordre par défaut. */
  sort: string | null;
  sortDir: "asc" | "desc";
  /** Colonne de groupement, ou `null`. */
  groupBy: string | null;
  page: number;
  pageSize: number;
}

const DEFAUTS = { page: 0, pageSize: 20, sortDir: "asc" as const };

/**
 * Etat d'un tableau, porte par l'URL.
 *
 * Auparavant, seules la page et la taille de page vivaient dans l'adresse ; la
 * recherche, les filtres et le tri etaient des `useState` locaux. Deux
 * consequences : l'etat disparaissait au rafraichissement, et surtout le
 * filtrage ne s'appliquait qu'aux lignes deja chargees — soit la page courante.
 * Chercher un client absent de la premiere page ne renvoyait rien, et le
 * compteur « 1-20 sur N » mentait des qu'un filtre etait actif.
 *
 * En passant par l'URL, ces parametres atteignent la requete serveur : la
 * recherche porte sur l'ensemble des donnees, et le compteur redevient exact.
 */
export function useDataGridState(): DataGridState & {
  setSearch: (v: string) => void;
  setFilter: (colonne: string, valeurs: string[]) => void;
  setSort: (colonne: string | null) => void;
  setGroupBy: (colonne: string | null) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  reset: () => void;
  /** Vrai des qu'une recherche ou un filtre est actif. */
  filtrageActif: boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const etat = useMemo<DataGridState>(() => {
    const filters: Record<string, string[]> = {};
    searchParams.forEach((valeur, cle) => {
      if (cle.startsWith("f_") && valeur) {
        filters[cle.slice(2)] = valeur.split(",").filter(Boolean);
      }
    });

    return {
      search: searchParams.get("q") ?? "",
      filters,
      sort: searchParams.get("tri"),
      sortDir: searchParams.get("sens") === "desc" ? "desc" : DEFAUTS.sortDir,
      groupBy: searchParams.get("groupe"),
      page: Math.max(0, parseInt(searchParams.get("page") ?? "0") || 0),
      pageSize: Math.max(1, parseInt(searchParams.get("size") ?? "20") || 20),
    };
  }, [searchParams]);

  const ecrire = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [cle, valeur] of Object.entries(patch)) {
        if (valeur === null || valeur === "") params.delete(cle);
        else params.set(cle, valeur);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setSearch = useCallback(
    // Toute modification du filtrage ramene en premiere page : rester page 3
    // d'un jeu de resultats qui vient de se reduire n'affiche rien.
    (v: string) => ecrire({ q: v || null, page: null }),
    [ecrire]
  );

  const setFilter = useCallback(
    (colonne: string, valeurs: string[]) =>
      ecrire({ [`f_${colonne}`]: valeurs.length ? valeurs.join(",") : null, page: null }),
    [ecrire]
  );

  const setSort = useCallback(
    (colonne: string | null) => {
      if (colonne === null) return ecrire({ tri: null, sens: null });
      // Un clic sur la colonne déjà triée inverse le sens, un clic ailleurs
      // repart en ordre croissant.
      const memeColonne = etat.sort === colonne;
      const sens = memeColonne && etat.sortDir === "asc" ? "desc" : "asc";
      ecrire({ tri: colonne, sens: sens === "asc" ? null : "desc" });
    },
    [ecrire, etat.sort, etat.sortDir]
  );

  const setGroupBy = useCallback(
    (colonne: string | null) => ecrire({ groupe: colonne, page: null }),
    [ecrire]
  );

  const setPage = useCallback(
    (v: number) => ecrire({ page: v > 0 ? String(v) : null }),
    [ecrire]
  );

  const setPageSize = useCallback(
    (v: number) => ecrire({ size: v === 20 ? null : String(v), page: null }),
    [ecrire]
  );

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const cle of [...params.keys()]) {
      if (cle === "q" || cle === "tri" || cle === "sens" || cle === "groupe" || cle === "page" || cle.startsWith("f_")) {
        params.delete(cle);
      }
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    ...etat,
    setSearch,
    setFilter,
    setSort,
    setGroupBy,
    setPage,
    setPageSize,
    reset,
    filtrageActif:
      etat.search.length > 0 || Object.keys(etat.filters).length > 0,
  };
}
