"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Alfrhelp?: {
      identify?: (identite: unknown) => void;
      open?: () => void;
      close?: () => void;
      toggle?: () => void;
    };
  }
}

/**
 * Passe au widget de support l'identité signée de l'utilisateur connecté.
 *
 * Monté dans le dossier `(dashboard)`, donc derrière l'authentification : il ne
 * s'exécute que pour quelqu'un de connecté, et la déconnexion recharge la page
 * (`window.location.href` dans le menu profil), ce qui remet le widget à zéro
 * sans identité résiduelle.
 *
 * Si quoi que ce soit échoue — endpoint muet, signature fausse, script du
 * widget jamais arrivé — le support continue de fonctionner avec une identité
 * « déclarée ». Un bug ici ne doit pas couper le canal.
 */
export function AlfrhelpIdentite() {
  useEffect(() => {
    let annule = false;
    let attente: ReturnType<typeof setTimeout> | undefined;

    // Le script est en `defer` : rien ne garantit qu'il ait fini quand React
    // hydrate. On attend qu'il se présente, sans y passer la journée.
    function transmettre(identite: unknown, essaisRestants: number) {
      if (annule) return;

      if (window.Alfrhelp?.identify) {
        window.Alfrhelp.identify(identite);
        return;
      }

      if (essaisRestants > 0) {
        attente = setTimeout(() => transmettre(identite, essaisRestants - 1), 250);
      }
    }

    fetch("/api/alfrhelp-identite")
      .then((r) => (r.ok ? r.json() : null))
      .then((identite) => {
        if (!identite || !identite.iat) return;
        transmettre(identite, 40); // 40 x 250 ms = 10 s
      })
      .catch(() => {
        // Silence volontaire : l'identité est un confort, pas une condition.
      });

    return () => {
      annule = true;
      if (attente) clearTimeout(attente);
    };
  }, []);

  return null;
}
