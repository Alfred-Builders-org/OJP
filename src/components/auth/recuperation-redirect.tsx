"use client";

import { useEffect } from "react";

/**
 * Aiguillage des liens d'authentification qui atterrissent au mauvais endroit.
 *
 * Supabase renvoie le jeton dans le fragment de l'URL, sur `site_url` — donc sur
 * la racine du site, et non sur l'ecran de choix du mot de passe, sauf si la
 * demande a passe un `redirect_to` explicite. La racine redirige vers le tableau
 * de bord, qui redirige vers la connexion : le navigateur conserve le fragment
 * tout du long, si bien que l'utilisatrice arrivait sur l'ecran de connexion
 * avec son jeton dans la barre d'adresse, sans que rien ne le remarque.
 *
 * Le filet ne regardait que `type=recovery`. Une invitation porte
 * `type=invite` : elle passait donc au travers, et la personne invitee restait
 * sur l'ecran de connexion — sans mot de passe, c'est justement le seul ecran
 * qui ne lui sert a rien.
 *
 * Un lien mort merite le meme soin : Supabase repond alors par une erreur dans
 * le fragment (`error_code=otp_expired`), que personne ne lit. On la traduit en
 * message sur l'ecran de connexion.
 */

/** Le jeton d'un lien perime ou deja utilise ne vaut plus rien. */
const DESTINATION_ERREUR = "/sign-in?error=lien";

/** Les deux actions qui demandent de choisir un mot de passe. */
const ACTIONS_MOT_DE_PASSE = ["recovery", "invite"];

/**
 * Ou renvoyer le navigateur au vu du fragment, ou `null` s'il n'y a rien a
 * faire. Le fragment est passe tel quel, `#` compris ou non.
 */
export function destinationDuFragment(hash: string): string | null {
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));

  // Supabase decrit l'echec dans le fragment plutot que par un code HTTP : sans
  // cette branche, un lien perime se solde par un ecran de connexion muet.
  if (fragment.get("error") || fragment.get("error_code")) {
    return DESTINATION_ERREUR;
  }

  const type = fragment.get("type");
  const aJeton = fragment.get("access_token") || fragment.get("token_hash");
  if (type && aJeton && ACTIONS_MOT_DE_PASSE.includes(type)) {
    return "/reset-password";
  }

  return null;
}

export function RecuperationRedirect() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/reset-password")) return;

    const destination = destinationDuFragment(window.location.hash);
    if (!destination) return;

    // Le fragment ne suit que la ou il sert : sur l'ecran de connexion, un jeton
    // dans la barre d'adresse n'a plus rien a faire.
    const cible =
      destination === DESTINATION_ERREUR
        ? destination
        : `${destination}${window.location.hash}`;

    // `replace` et non `push` : le jeton ne doit pas rester dans l'historique
    // d'un poste partage, et le retour arriere ne doit pas y ramener.
    window.location.replace(cible);
  }, []);

  return null;
}
