import type { NextRequest } from "next/server";

/**
 * Détermine l'adresse publique de l'application pour construire les liens
 * envoyés par e-mail (invitation, réinitialisation de mot de passe).
 *
 * L'origine est déduite de la requête entrante : un lien demandé depuis
 * l'espace de test pointe vers l'espace de test, un lien demandé depuis le
 * site en ligne pointe vers le site en ligne. Plus aucune variable à tenir à
 * jour à chaque environnement, et plus de lien vers localhost envoyé à un
 * client.
 *
 * `NEXT_PUBLIC_SITE_URL` reste prioritaire lorsqu'elle est définie : elle
 * permet de forcer un domaine personnalisé, et protège au passage d'un en-tête
 * `Host` falsifié.
 */
export function getSiteUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  // Origin est present sur les requetes du navigateur (fetch same-origin).
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  // Derriere le proxy Railway, l'hote reel est dans x-forwarded-host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
