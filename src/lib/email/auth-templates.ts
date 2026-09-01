/**
 * Textes des courriels d'authentification.
 *
 * Le nom de l'enseigne figure dans chaque sujet, et c'est la raison sociale
 * exacte — « L'Or au Juste Prix ». Sur un courriel qui demande de changer un mot
 * de passe, l'expediteur doit se reconnaitre des la liste des messages, et un
 * nom approximatif fait exactement le contraire.
 *
 * Supabase envoyait jusqu'ici ses gabarits d'origine : en anglais, sans logo,
 * signes « Supabase Auth ». Un commerçant qui demande un nouveau mot de passe a
 * son ERP recevait un message qui ne ressemblait a rien de la boutique — le
 * genre de courriel qu'on classe en indesirable.
 *
 * Chaque action porte donc son propre texte, en français, et sa destination
 * apres clic : un lien de reinitialisation qui ramene au tableau de bord sans
 * proposer de choisir un mot de passe ne sert a rien.
 */

/** Les actions que Supabase Auth peut demander d'envoyer. */
export type ActionAuth =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication";

interface GabaritAuth {
  sujet: string;
  titre: string;
  lignes: string[];
  libelleBouton: string;
  /** Ou atterrir une fois le jeton verifie. */
  destination: string;
  validite: string;
}

const HEURE = "Ce lien est valable une heure et ne peut servir qu'une fois.";

export const GABARITS_AUTH: Record<ActionAuth, GabaritAuth> = {
  recovery: {
    sujet: "Réinitialiser votre mot de passe — L'Or au Juste Prix",
    titre: "Réinitialisation de votre mot de passe",
    lignes: [
      "Vous avez demandé à définir un nouveau mot de passe pour votre accès à L'Or au Juste Prix.",
      "Cliquez sur le bouton ci-dessous pour en choisir un.",
    ],
    libelleBouton: "Choisir un nouveau mot de passe",
    destination: "/reset-password",
    validite: HEURE,
  },

  invite: {
    sujet: "Vous êtes invité à rejoindre L'Or au Juste Prix",
    titre: "Bienvenue chez L'Or au Juste Prix",
    lignes: [
      "Un accès à l'ERP de la boutique vient d'être créé pour vous.",
      "Il ne reste qu'à choisir votre mot de passe pour vous connecter.",
    ],
    libelleBouton: "Activer mon accès",
    destination: "/reset-password",
    validite: "Cette invitation est valable vingt-quatre heures.",
  },

  signup: {
    sujet: "Confirmez votre adresse e-mail — L'Or au Juste Prix",
    titre: "Confirmation de votre adresse",
    lignes: [
      "Merci de confirmer votre adresse e-mail pour activer votre accès à L'Or au Juste Prix.",
    ],
    libelleBouton: "Confirmer mon adresse",
    destination: "/dashboard",
    validite: HEURE,
  },

  magiclink: {
    sujet: "Votre lien de connexion — L'Or au Juste Prix",
    titre: "Connexion à L'Or au Juste Prix",
    lignes: ["Cliquez sur le bouton ci-dessous pour vous connecter, sans mot de passe."],
    libelleBouton: "Me connecter",
    destination: "/dashboard",
    validite: HEURE,
  },

  email_change: {
    sujet: "Confirmez votre nouvelle adresse e-mail — L'Or au Juste Prix",
    titre: "Changement d'adresse e-mail",
    lignes: [
      "Vous avez demandé à changer l'adresse e-mail associée à votre compte.",
      "Confirmez ce changement pour qu'il prenne effet.",
    ],
    libelleBouton: "Confirmer le changement",
    destination: "/profile",
    validite: HEURE,
  },

  // Un changement d'adresse demande une confirmation de chaque cote : l'ancienne
  // pour autoriser le depart, la nouvelle pour accuser l'arrivee.
  email_change_current: {
    sujet: "Confirmez le changement de votre adresse e-mail — L'Or au Juste Prix",
    titre: "Changement d'adresse e-mail",
    lignes: [
      "Une demande de changement d'adresse a été faite depuis votre compte.",
      "Confirmez depuis votre adresse actuelle pour l'autoriser.",
    ],
    libelleBouton: "Autoriser le changement",
    destination: "/profile",
    validite: HEURE,
  },

  email_change_new: {
    sujet: "Confirmez votre nouvelle adresse e-mail — L'Or au Juste Prix",
    titre: "Votre nouvelle adresse e-mail",
    lignes: ["Confirmez cette adresse pour qu'elle devienne celle de votre compte."],
    libelleBouton: "Confirmer cette adresse",
    destination: "/profile",
    validite: HEURE,
  },

  // Seule action sans lien : Supabase attend un code saisi dans l'application.
  reauthentication: {
    sujet: "Votre code de vérification — L'Or au Juste Prix",
    titre: "Code de vérification",
    lignes: ["Saisissez ce code dans l'application pour confirmer votre identité."],
    libelleBouton: "",
    destination: "",
    validite: "Ce code est valable une heure.",
  },
};

/** Repli sur la reinitialisation : c'est l'action de loin la plus frequente. */
export function gabaritPour(action: string): GabaritAuth {
  return GABARITS_AUTH[action as ActionAuth] ?? GABARITS_AUTH.recovery;
}
