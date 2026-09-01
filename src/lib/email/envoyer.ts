import { render } from "@react-email/components";
import React from "react";
import { getResend } from "./resend";
import { EmailWrapper } from "./wrapper";
import { LOGO_CID, pieceLogo } from "./logo";
import type { Gabarit } from "./gabarits";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CourrielType } from "@/types/email";
import type { CompanySettings } from "@/types/settings";

/**
 * Le socle d'envoi : mise en forme, expedition, journal.
 *
 * Un seul chemin pour les quatre courriels. Il remplace l'ancien
 * `sendNotification`, qui allait d'abord chercher un gabarit en base et
 * remplaçait des variables a la volee — le texte vit maintenant dans le code,
 * et ce qui arrive ici est deja ecrit.
 *
 * Rien de ce qui se passe ici ne doit interrompre l'operation metier qui l'a
 * declenche. Un dossier se cloture meme si Resend est en panne : le courriel
 * echoue, l'echec s'inscrit dans `email_logs`, et la boutique continue de
 * tourner.
 */

export interface PieceJointe {
  filename: string;
  content: Buffer;
}

export interface Envoi {
  type: CourrielType;
  destinataire: string;
  gabarit: Gabarit;
  pieces?: PieceJointe[];
  lotId?: string | null;
  dossierId?: string | null;
  clientId?: string | null;
}

export interface ResultatEnvoi {
  envoye: boolean;
  motif?: string;
}

/**
 * L'expediteur, tel que la boutique s'est nommee.
 *
 * Le reglage en base prime sur la variable d'environnement : c'est l'ecran des
 * parametres qui fait foi. Le repli final n'est la que pour un environnement
 * neuf, ou aucune des deux n'existe encore.
 */
async function expediteur(): Promise<string> {
  const { data } = await getSupabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", "company")
    .single();

  const societe = data?.value as CompanySettings | undefined;
  const adresse =
    societe?.email_expediteur || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const nom = societe?.nom_expediteur || "L'Or au Juste Prix";

  return `${nom} <${adresse}>`;
}

export async function envoyerCourriel(envoi: Envoi): Promise<ResultatEnvoi> {
  const { type, destinataire, gabarit, pieces = [], lotId, dossierId, clientId } = envoi;

  // Un client sans adresse n'est pas une anomalie : beaucoup passent au
  // comptoir sans en laisser. On le note sans envoyer, plutot que de lever une
  // erreur qui remonterait jusqu'a l'ecran de cloture.
  if (!destinataire) {
    await journaliser({
      type,
      destinataire: "—",
      sujet: gabarit.sujet,
      resendId: null,
      motif: "Aucune adresse e-mail connue pour ce client",
      lotId,
      dossierId,
      clientId,
    });
    return { envoye: false, motif: "Aucune adresse e-mail connue pour ce client" };
  }

  try {
    const html = await render(
      React.createElement(EmailWrapper, {
        blocs: gabarit.blocs,
        // Le logo voyage avec le message plutot que d'etre appele a distance :
        // les messageries bloquent les images externes, et l'en-tete
        // apparaissait un coup sur deux.
        logoUrl: `cid:${LOGO_CID}`,
      })
    );

    const { data, error } = await getResend().emails.send({
      from: await expediteur(),
      to: destinataire,
      subject: gabarit.sujet,
      html,
      attachments: [pieceLogo(), ...pieces],
    });

    await journaliser({
      type,
      destinataire,
      sujet: gabarit.sujet,
      resendId: data?.id ?? null,
      motif: error?.message ?? null,
      lotId,
      dossierId,
      clientId,
    });

    if (error) {
      console.error(`[courriel] ${type} refusé par Resend :`, error.message);
      return { envoye: false, motif: error.message };
    }

    return { envoye: true };
  } catch (err) {
    const motif = err instanceof Error ? err.message : "Erreur inattendue";
    console.error(`[courriel] ${type} en échec :`, motif);

    await journaliser({
      type,
      destinataire,
      sujet: gabarit.sujet,
      resendId: null,
      motif,
      lotId,
      dossierId,
      clientId,
    });

    return { envoye: false, motif };
  }
}

interface EntreeJournal {
  type: CourrielType;
  destinataire: string;
  sujet: string;
  resendId: string | null;
  motif: string | null;
  lotId?: string | null;
  dossierId?: string | null;
  clientId?: string | null;
}

/**
 * Le journal sert deux fois : a repondre a « je n'ai rien reçu », et a empecher
 * un rappel de partir a chaque passage du balayage. Il ne doit donc jamais
 * echouer en silence sans qu'on le sache.
 */
async function journaliser(entree: EntreeJournal): Promise<void> {
  try {
    await getSupabaseAdmin().from("email_logs").insert({
      notification_type: entree.type,
      recipient_email: entree.destinataire,
      subject: entree.sujet,
      resend_id: entree.resendId,
      status: entree.motif ? "failed" : "sent",
      error_message: entree.motif,
      lot_id: entree.lotId ?? null,
      dossier_id: entree.dossierId ?? null,
      client_id: entree.clientId ?? null,
    });
  } catch (err) {
    console.error("[courriel] journalisation impossible :", err);
  }
}

/**
 * Les lots ayant deja reçu ce courriel.
 *
 * Seuls les envois reussis comptent. Un echec ne doit pas condamner un rappel :
 * si Resend etait indisponible a midi, le balayage de treize heures doit
 * reessayer, tant que l'echeance n'est pas passee.
 */
export async function lotsDejaNotifies(type: CourrielType): Promise<Set<string>> {
  const { data } = await getSupabaseAdmin()
    .from("email_logs")
    .select("lot_id")
    .eq("notification_type", type)
    .eq("status", "sent")
    .not("lot_id", "is", null);

  return new Set((data ?? []).map((ligne: { lot_id: string }) => ligne.lot_id));
}

/** Meme chose au niveau du dossier, pour le recapitulatif de cloture. */
export async function dossiersDejaNotifies(type: CourrielType): Promise<Set<string>> {
  const { data } = await getSupabaseAdmin()
    .from("email_logs")
    .select("dossier_id")
    .eq("notification_type", type)
    .eq("status", "sent")
    .not("dossier_id", "is", null);

  return new Set((data ?? []).map((ligne: { dossier_id: string }) => ligne.dossier_id));
}

/**
 * Descend les pieces jointes du bucket.
 *
 * Une piece manquante ne bloque pas l'envoi : mieux vaut un recapitulatif sans
 * son contrat qu'aucun courriel du tout. L'absence se lit dans les journaux du
 * serveur, et le document reste telechargeable depuis l'application.
 */
export async function telechargerPieces(
  chemins: { path: string; nom: string }[]
): Promise<PieceJointe[]> {
  const pieces: PieceJointe[] = [];

  for (const { path, nom } of chemins) {
    const { data, error } = await getSupabaseAdmin().storage.from("documents").download(path);

    if (error || !data) {
      console.error(`[courriel] pièce jointe introuvable : ${path}`);
      continue;
    }

    pieces.push({
      filename: nom,
      content: Buffer.from(await data.arrayBuffer()),
    });
  }

  return pieces;
}
