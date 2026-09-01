"use client";

import { useEffect } from "react";

/**
 * Aiguillage des liens de reinitialisation qui atterrissent au mauvais endroit.
 *
 * Supabase renvoie le jeton de recuperation dans le fragment de l'URL, sur
 * `site_url` — donc sur la racine du site, et non sur l'ecran de choix du mot de
 * passe, sauf si la demande a passe un `redirect_to` explicite. La racine
 * redirige vers le tableau de bord, qui redirige vers la connexion : le
 * navigateur conserve le fragment tout du long, si bien que l'utilisatrice
 * arrivait sur l'ecran de connexion avec son jeton dans la barre d'adresse, sans
 * que rien ne le remarque.
 *
 * Ce composant regarde le fragment sur les ecrans d'authentification et renvoie
 * vers `/reset-password` en le conservant. C'est un filet : quand le
 * `redirect_to` est correct, il ne fait rien.
 */
export function RecuperationRedirect() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/reset-password")) return;

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const type = fragment.get("type");
    const aJeton = fragment.get("access_token") || fragment.get("token_hash");

    if (type === "recovery" && aJeton) {
      // `replace` et non `push` : le jeton ne doit pas rester dans l'historique
      // d'un poste partage, et le retour arriere ne doit pas y ramener.
      window.location.replace(`/reset-password${window.location.hash}`);
    }
  }, []);

  return null;
}
