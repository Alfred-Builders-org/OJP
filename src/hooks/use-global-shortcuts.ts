"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Raccourcis de navigation globaux.
 *
 * On lit `e.code` et non `e.key` : sur macOS, Option est un modificateur de
 * composition, si bien qu'Alt+D remplit `e.key` avec « ∂ », Alt+S avec « ß »,
 * Alt+C avec « ç ». Aucun raccourci ne se declenchait sur Mac. `e.code` designe
 * la touche physique et reste stable quels que soient la disposition clavier et
 * les modificateurs enfonces.
 *
 * Le raccourci « nouveau dossier » est en Alt+N : Cmd/Ctrl+Maj+N est intercepte
 * par le navigateur (fenetre de navigation privee) et n'atteint jamais la page.
 */
const NAVIGATION: Record<string, string> = {
  KeyD: "/dashboard",
  KeyL: "/lots",
  KeyS: "/stock",
  KeyV: "/ventes",
  KeyC: "/clients",
  KeyN: "/dossiers/new",
};

export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (!e.altKey || e.metaKey || e.ctrlKey) return;

      const destination = NAVIGATION[e.code];
      if (!destination) return;

      e.preventDefault();
      router.push(destination);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
