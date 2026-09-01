import { render } from "@react-email/components";
import React from "react";
import { getResend } from "./resend";
import { AuthEmail } from "./auth-email";
import { GABARITS_AUTH } from "./auth-templates";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanySettings } from "@/types/settings";

/**
 * Envoi du courriel d'invitation, par l'application elle-meme.
 *
 * L'invitation est declenchee depuis l'ecran des utilisateurs : c'est donc
 * l'application qui sait qu'elle doit ecrire, et rien n'oblige a passer par le
 * « Send Email Hook » de Supabase — lequel n'est utile que pour les courriels
 * que Supabase declenche seul, comme le mot de passe oublie.
 *
 * Le service d'envoi integre de Supabase, lui, refuse d'ecrire a une adresse
 * exterieure a l'organisation du projet : une invitation adressee a une cliente
 * n'en serait jamais partie. Elle part donc par Resend, avec le gabarit maison,
 * et s'inscrit dans `email_logs` comme les courriels metier.
 */

interface Invitation {
  destinataire: string;
  /** Le lien deja construit, qui passe par `/auth/callback`. */
  lien: string;
  /** Adresse publique de l'environnement qui envoie, pour le logo. */
  origine: string;
}

interface ResultatEnvoi {
  envoye: boolean;
  /** Ce que Resend a repondu quand il a refuse, en clair. */
  motif?: string;
}

export async function envoyerInvitation({
  destinataire,
  lien,
  origine,
}: Invitation): Promise<ResultatEnvoi> {
  const gabarit = GABARITS_AUTH.invite;

  const html = await render(
    React.createElement(AuthEmail, {
      titre: gabarit.titre,
      lignes: gabarit.lignes,
      lien,
      libelleBouton: gabarit.libelleBouton,
      validite: gabarit.validite,
      // Le logo est servi par l'application : un courriel qui affiche un carre
      // casse a la place de l'enseigne ressemble a du hameçonnage, et celui-ci
      // demande justement de choisir un mot de passe.
      logoUrl: `${origine}/logo-light.png`,
    })
  );

  const { data: ligne } = await getSupabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", "company")
    .single();
  const societe = ligne?.value as CompanySettings | undefined;
  const from =
    societe?.email_expediteur ||
    process.env.RESEND_FROM_EMAIL ||
    "onboarding@resend.dev";
  const nom = societe?.nom_expediteur || "L'Or au Juste Prix";

  const { data: envoi, error: erreur } = await getResend().emails.send({
    from: `${nom} <${from}>`,
    to: destinataire,
    subject: gabarit.sujet,
    html,
  });

  // Journalise au meme endroit que les courriels metier : quand quelqu'un dit
  // n'avoir rien reçu, c'est la qu'on regarde.
  await getSupabaseAdmin().from("email_logs").insert({
    notification_type: "auth_invite",
    recipient_email: destinataire,
    subject: gabarit.sujet,
    resend_id: envoi?.id ?? null,
    status: erreur ? "failed" : "sent",
    error_message: erreur?.message ?? null,
  });

  if (erreur) {
    console.error("[invitation] envoi échoué", erreur.message);
    return { envoye: false, motif: erreur.message };
  }

  return { envoye: true };
}
