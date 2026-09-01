import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { CourrielType } from "@/types/email";

/**
 * Le texte des quatre courriels que l'application ecrit au client.
 *
 * Ils etaient auparavant stockes en base et modifiables depuis un ecran de
 * reglages, avec des variables `{{client_nom}}` remplacees a l'envoi. Ce
 * mecanisme rendait possible qu'un courriel parte avec une accolade orpheline
 * ou un montant absent, sans que rien ne le signale : un gabarit casse ne se
 * voit qu'a la reception.
 *
 * Le texte revient donc dans le code, ou le compilateur verifie que chaque
 * donnee citee existe vraiment, et ou un changement de formulation passe par
 * une relecture.
 *
 * Un gabarit rend un sujet et des lignes. La mise en forme, l'enseigne et le
 * logo appartiennent au `EmailWrapper` — ici on n'ecrit que des phrases.
 */

export interface Gabarit {
  sujet: string;
  lignes: string[];
}

/** Nom d'usage du client, pour l'entree en matiere. */
export interface Destinataire {
  civilite: string | null;
  prenom: string;
  nom: string;
}

function bonjour(client: Destinataire): string {
  return `Bonjour ${client.prenom} ${client.nom},`;
}

const SIGNATURE = ["Cordialement,", "L'Or au Juste Prix"];

/** Ligne de recapitulatif d'un lot clos. */
export interface LigneRecap {
  numero: string;
  /** « rachat », « vente » ou « dépôt-vente », deja en clair. */
  nature: string;
  /** Ce qui est arrive au lot, quand ce n'est pas le deroulement normal. */
  issue: string | null;
  nbArticles: number;
  montant: number;
}

export interface RecapCloture {
  client: Destinataire;
  dossierNumero: string;
  lots: LigneRecap[];
  /** Noms des pieces jointes, cites pour que leur absence se remarque. */
  documents: string[];
}

/**
 * Cloture d'un dossier : ce qui s'est passe, et les pieces qui l'attestent.
 *
 * Un dossier peut contenir plusieurs lots de natures differentes — un rachat et
 * un depot-vente le meme jour — et certains n'aboutissent pas. Le recapitulatif
 * les nomme tous, y compris ceux sans suite : le client doit retrouver le
 * compte de ce qu'il a apporte, pas seulement de ce qui lui a ete paye.
 */
export function gabaritDossierCloture(recap: RecapCloture): Gabarit {
  const lignes: string[] = [
    bonjour(recap.client),
    "",
    `Votre dossier n°${recap.dossierNumero} est clôturé. Voici le récapitulatif de ce qui s'y est passé.`,
    "",
  ];

  for (const lot of recap.lots) {
    const articles = `${lot.nbArticles} article${lot.nbArticles > 1 ? "s" : ""}`;
    const issue = lot.issue ? ` — ${lot.issue}` : "";
    lignes.push(
      `• ${lot.numero} — ${lot.nature} — ${articles} — ${formatCurrency(lot.montant)}${issue}`
    );
  }

  // Le total n'a de sens qu'a plusieurs lots : repeter un montant unique deja
  // ecrit juste au-dessus donne l'impression d'une somme a payer en plus.
  if (recap.lots.length > 1) {
    const total = recap.lots.reduce((somme, lot) => somme + lot.montant, 0);
    lignes.push("", `Total : ${formatCurrency(total)}`);
  }

  if (recap.documents.length > 0) {
    lignes.push(
      "",
      `Vous trouverez ci-joint ${recap.documents.length > 1 ? "les documents suivants" : "le document suivant"} :`
    );
    for (const nom of recap.documents) lignes.push(`• ${nom}`);
  }

  lignes.push(
    "",
    "Conservez ces documents : ils vous seront demandés en cas de question sur cette opération.",
    "",
    ...SIGNATURE
  );

  return {
    sujet: `Votre dossier ${recap.dossierNumero} est clôturé — L'Or au Juste Prix`,
    lignes,
  };
}

export interface RappelDevis {
  client: Destinataire;
  devisNumero: string | null;
  nbArticles: number;
  montant: number;
  /** Instant exact ou le devis cesse d'engager la boutique. */
  dateFin: string;
}

/**
 * Devis sur le point d'expirer.
 *
 * Le prix d'un devis de rachat tient au cours des metaux le jour ou il est
 * emis. Passe le delai, il n'engage plus rien — et le client qui revient trois
 * jours plus tard avec un prix perime le vit comme un desaveu. Le rappel arrive
 * donc pendant qu'il peut encore decider.
 */
export function gabaritDevisExpireBientot(rappel: RappelDevis): Gabarit {
  const reference = rappel.devisNumero ? ` n°${rappel.devisNumero}` : "";
  const articles = `${rappel.nbArticles} article${rappel.nbArticles > 1 ? "s" : ""}`;

  return {
    sujet: `Votre devis${reference} expire demain — L'Or au Juste Prix`,
    lignes: [
      bonjour(rappel.client),
      "",
      `Votre devis${reference} portant sur ${articles}, d'un montant de ${formatCurrency(rappel.montant)}, arrive à échéance le ${formatDateTime(rappel.dateFin)}.`,
      "",
      "Passé ce délai, le prix proposé ne pourra plus être garanti : il est calculé sur le cours des métaux au jour de l'estimation.",
      "",
      "Si vous souhaitez donner suite, il vous suffit de nous le faire savoir avant cette date.",
      "",
      ...SIGNATURE,
    ],
  };
}

export interface CommandePrete {
  client: Destinataire;
  lotNumero: string;
  articles: string[];
}

/**
 * Commande arrivee en boutique.
 *
 * Envoye quand le dernier article du lot est receptionne, jamais avant : deux
 * courriels pour une meme commande arrivant en deux fois feraient venir le
 * client pour rien.
 */
export function gabaritCommandePrete(commande: CommandePrete): Gabarit {
  const lignes: string[] = [
    bonjour(commande.client),
    "",
    "Bonne nouvelle : votre commande est arrivée et vous attend en boutique.",
    "",
  ];

  for (const article of commande.articles) lignes.push(`• ${article}`);

  lignes.push(
    "",
    "Vous pouvez venir la retirer aux horaires d'ouverture, muni d'une pièce d'identité.",
    "",
    ...SIGNATURE
  );

  return {
    sujet: `Votre commande ${commande.lotNumero} est disponible — L'Or au Juste Prix`,
    lignes,
  };
}

export interface RappelSolde {
  client: Destinataire;
  factureNumero: string | null;
  montantRestant: number;
  dateLimite: string;
}

/**
 * Rappel du solde a regler.
 *
 * Il part a la moitie du delai accorde : assez tot pour qu'un virement ait le
 * temps d'arriver, assez tard pour ne pas relancer quelqu'un qui vient de
 * signer. Le montant annonce est ce qui reste vraiment du, acompte deduit.
 */
export function gabaritRappelSolde(rappel: RappelSolde): Gabarit {
  const reference = rappel.factureNumero ? ` n°${rappel.factureNumero}` : "";

  return {
    sujet: `Rappel : solde de votre facture${reference} — L'Or au Juste Prix`,
    lignes: [
      bonjour(rappel.client),
      "",
      `Nous vous rappelons que le solde de votre facture${reference}, soit ${formatCurrency(rappel.montantRestant)}, est à régler avant le ${formatDate(rappel.dateLimite)}.`,
      "",
      "Votre commande reste réservée jusqu'à cette date.",
      "",
      "Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.",
      "",
      ...SIGNATURE,
    ],
  };
}

/** Libelles courts, pour les journaux et l'ecran des envois. */
export const LIBELLES: Record<CourrielType, string> = {
  dossier_cloture: "Dossier clôturé",
  devis_expire_bientot: "Devis bientôt expiré",
  commande_prete: "Commande disponible",
  rappel_solde: "Rappel de solde",
};
