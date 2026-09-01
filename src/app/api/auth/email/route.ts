import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { render } from "@react-email/components";
import React from "react";
import { getResend } from "@/lib/email/resend";
import { AuthEmail } from "@/lib/email/auth-email";
import { gabaritPour } from "@/lib/email/auth-templates";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanySettings } from "@/types/settings";

/**
 * Envoi des courriels d'authentification.
 *
 * Supabase Auth appelle cette route a la place de son propre SMTP — c'est le
 * « Send Email Hook ». Les messages partent donc par Resend, avec le logo et la
 * mise en forme de la boutique, en français, au lieu du gabarit d'origine en
 * anglais signe « Supabase Auth ».
 *
 * La route n'est pas authentifiee au sens de l'application : l'appelant est
 * Supabase, pas un utilisateur. C'est la signature du webhook qui fait foi, et
 * elle est verifiee avant toute chose. Sans secret configure, la route refuse
 * tout : mieux vaut un courriel non envoye qu'une porte ouverte.
 */

/** Tolerance sur l'horodatage, en secondes. Rejoue au-dela. */
const TOLERANCE_S = 300;

interface CorpsHook {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

/**
 * Verifie une signature au format standard-webhooks.
 *
 * Le contenu signe est « id.timestamp.corps », la cle est la partie base64 du
 * secret `v1,whsec_…`, et l'en-tete peut porter plusieurs signatures separees
 * par une espace — pendant une rotation de secret, notamment.
 */
function signatureValide(
  secret: string,
  id: string,
  timestamp: string,
  corps: string,
  entete: string
): boolean {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_S) return false;

  const base64 = secret.replace(/^v1,\s*/, "").replace(/^whsec_/, "");
  const cle = Buffer.from(base64, "base64");
  const attendue = crypto
    .createHmac("sha256", cle)
    .update(`${id}.${timestamp}.${corps}`)
    .digest("base64");

  return entete
    .split(" ")
    .map((s) => s.replace(/^v1,/, ""))
    .some((fournie) => {
      const a = Buffer.from(fournie);
      const b = Buffer.from(attendue);
      // Comparaison a temps constant : une comparaison naive fuit la signature
      // attendue, octet par octet, a qui mesure le temps de reponse.
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
}

export async function POST(request: NextRequest) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    console.error("[auth-email] SEND_EMAIL_HOOK_SECRET manquant");
    return NextResponse.json({ error: "Hook non configuré" }, { status: 500 });
  }
  // Dit clairement ce qui manque. Sans ce garde-fou, le constructeur de Resend
  // leve sur une cle vide et la trace ne parle que d'un appel a `new Resend`.
  if (!process.env.RESEND_API_KEY) {
    console.error("[auth-email] RESEND_API_KEY manquant : aucun courriel ne partira");
    return NextResponse.json({ error: "Expéditeur non configuré" }, { status: 500 });
  }

  const corps = await request.text();
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signature = request.headers.get("webhook-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Signature absente" }, { status: 401 });
  }
  if (!signatureValide(secret, id, timestamp, corps, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let charge: CorpsHook;
  try {
    charge = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const destinataire = charge.user?.email;
  const donnees = charge.email_data;
  if (!destinataire || !donnees) {
    return NextResponse.json({ error: "Charge incomplète" }, { status: 400 });
  }

  // Le logo est servi par l'application elle-meme, et non par un bucket : le
  // bucket `assets` de production ne le contient pas, et un courriel qui affiche
  // un carre casse a la place du logo de la boutique inspire tout sauf
  // confiance — sur un message qui demande de changer un mot de passe, c'est le
  // pire moment pour ressembler a un courriel frauduleux.
  const origine = donnees.site_url || process.env.NEXT_PUBLIC_APP_URL || "";
  const logoUrl = `${origine}/logo-light.png`;

  const action = donnees.email_action_type;
  const gabarit = gabaritPour(action);
  const codeSeul = action === "reauthentication";

  // Le lien passe par /auth/callback, qui verifie le jeton puis redirige. La
  // destination vient du gabarit, sauf si Supabase en impose une : c'est le cas
  // d'une invitation lancee depuis un ecran precis de l'application.
  let lien: string | undefined;
  if (!codeSeul) {
    const suite = suiteSure(donnees.redirect_to) ?? gabarit.destination;
    const params = new URLSearchParams({
      token_hash: donnees.token_hash,
      type: action,
      next: suite,
    });
    lien = `${origine}/auth/callback?${params.toString()}`;
  }

  const html = await render(
    React.createElement(AuthEmail, {
      titre: gabarit.titre,
      lignes: gabarit.lignes,
      lien,
      libelleBouton: gabarit.libelleBouton,
      code: codeSeul ? donnees.token : undefined,
      validite: gabarit.validite,
      logoUrl,
    })
  );

  const { data: ligne } = await getSupabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", "company")
    .single();
  const societe = ligne?.value as CompanySettings | undefined;
  const from = societe?.email_expediteur || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const nom = societe?.nom_expediteur || "Or au Juste Prix";

  const { data: envoi, error: erreur } = await getResend().emails.send({
    from: `${nom} <${from}>`,
    to: destinataire,
    subject: gabarit.sujet,
    html,
  });

  // Journalise au meme endroit que les courriels metier : quand un utilisateur
  // dit n'avoir rien reçu, c'est la qu'on regarde.
  await getSupabaseAdmin()
    .from("email_logs")
    .insert({
      notification_type: `auth_${action}`,
      recipient_email: destinataire,
      subject: gabarit.sujet,
      resend_id: envoi?.id ?? null,
      status: erreur ? "failed" : "sent",
      error_message: erreur?.message ?? null,
    });

  if (erreur) {
    console.error("[auth-email] envoi échoué", erreur.message);
    // Un 500 fait echouer l'action cote Supabase, et l'utilisateur voit une
    // erreur au lieu d'attendre en vain un courriel qui ne viendra pas.
    return NextResponse.json({ error: erreur.message }, { status: 500 });
  }

  return NextResponse.json({});
}

/**
 * Une redirection venue de la requete ne doit pas pouvoir sortir du site.
 * On ne retient qu'un chemin relatif ; le reste est ignore au profit du gabarit.
 */
function suiteSure(redirect?: string): string | null {
  if (!redirect) return null;
  try {
    const chemin = redirect.startsWith("/")
      ? redirect
      : new URL(redirect).pathname + new URL(redirect).search;
    return chemin.startsWith("/") && !chemin.startsWith("//") ? chemin : null;
  } catch {
    return null;
  }
}
