/**
 * Les courriels que l'application ecrit d'elle-meme.
 *
 * Ils ne sont plus modifiables depuis l'application : leur texte vit dans
 * `src/lib/email/gabarits.ts`, sous revue comme le reste du code. Un courriel
 * qui part au nom de la boutique engage la boutique — il se relit en diff, pas
 * dans un formulaire.
 *
 * `email_logs` reste : c'est la qu'on regarde quand quelqu'un dit n'avoir rien
 * reçu, et c'est aussi ce qui empeche un rappel de partir deux fois.
 */
export type CourrielType =
  | "dossier_cloture"
  | "devis_expire_bientot"
  | "commande_prete"
  | "rappel_solde";

/** Les courriels d'authentification, journalises au meme endroit. */
export type CourrielAuthType = "auth_invite" | "auth_recovery";

export type NotificationType = CourrielType | CourrielAuthType;

export interface EmailLog {
  id: string;
  notification_type: NotificationType;
  recipient_email: string;
  subject: string;
  resend_id: string | null;
  status: "sent" | "failed";
  error_message: string | null;
  lot_id: string | null;
  dossier_id: string | null;
  client_id: string | null;
  created_at: string;
}
