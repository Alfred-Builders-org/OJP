"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Onglet actif porte par l'URL plutot que par un `useState`.
 *
 * Un rafraichissement ramenait systematiquement sur le premier onglet, et
 * l'adresse d'un onglet precis n'etait ni partageable ni marquable. On ecrit en
 * `replace` : parcourir des onglets n'a pas a remplir l'historique du navigateur.
 *
 * @param param nom du parametre d'URL (ex. « section »)
 * @param fallback onglet affiche quand l'URL ne dit rien, ou dit n'importe quoi
 * @param allowed valeurs acceptees — une URL bricolee a la main ne doit pas
 *   produire un ecran vide
 */
export function useUrlTab<T extends string>(
  param: string,
  fallback: T,
  allowed: readonly T[]
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get(param) as T | null;
  const active = raw && allowed.includes(raw) ? raw : fallback;

  const setActive = useCallback(
    (value: T) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === fallback) {
        params.delete(param);
      } else {
        params.set(param, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [fallback, param, pathname, router, searchParams]
  );

  return [active, setActive];
}
