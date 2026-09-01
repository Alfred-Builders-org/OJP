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
 * Un gabarit ne rend pas des phrases mises bout a bout mais des **blocs** :
 * un montant est un montant, une liste d'articles est une liste d'articles.
 * La premiere version alignait des lignes de texte, et le rendu ne pouvait
 * alors que les empiler — impossible d'aligner une colonne de prix ou de poser
 * un sous-total sous son detail. Le style appartient au `EmailWrapper`, la
 * structure se decide ici.
 */

/** Un article, tel qu'il figure au detail d'un lot. */
export interface ArticleRecap {
  designation: string;
  quantite: number;
  montant: number;
  /** Ce qui lui est arrive, quand ce n'est pas l'achat ordinaire. */
  sort: string | null;
}

export type Bloc =
  | { type: "paragraphe"; texte: string }
  | { type: "note"; texte: string }
  | {
      type: "lot";
      numero: string;
      nature: string;
      issue: string | null;
      nbArticles: number;
      montant: number;
      articles: ArticleRecap[];
    }
  | { type: "total"; montant: number }
  | { type: "liste"; items: string[] }
  | { type: "encadre"; lignes: { libelle: string; valeur: string; fort?: boolean }[] }
  | { type: "pieces"; noms: string[] }
  | { type: "signature" };

export interface Gabarit {
  sujet: string;
  blocs: Bloc[];
}

/** Nom d'usage du client, pour l'entree en matiere. */
export interface Destinataire {
  civilite: string | null;
  prenom: string;
  nom: string;
}

function bonjour(client: Destinataire): Bloc {
  return { type: "paragraphe", texte: `Bonjour ${client.prenom} ${client.nom},` };
}

/**
 * La phrase qui annonce les pieces, et rien de plus.
 *
 * Le corps du message listait auparavant chaque fichier dans un cadre gris,
 * avec son nom et son extension. Ces cadres ressemblaient a des pieces jointes
 * sans en etre : rien ne s'ouvrait au clic, alors que les vraies pieces
 * attendaient plus bas, affichees par la messagerie. Deux listes pour les memes
 * documents, dont une inerte.
 *
 * Une phrase suffit. Les noms, les icones et les boutons de telechargement sont
 * l'affaire du client de messagerie, qui le fait mieux et au bon endroit.
 */
export function mentionPieces(nombre: number): string {
  return nombre > 1
    ? `Les ${nombre} documents de votre dossier sont joints à ce message.`
    : "Le document de votre dossier est joint à ce message.";
}

/** Aplatit un gabarit en texte brut — utile aux tests et aux journaux. */
export function texteDe(gabarit: Gabarit): string {
  const lignes: string[] = [];

  for (const bloc of gabarit.blocs) {
    switch (bloc.type) {
      case "paragraphe":
      case "note":
        lignes.push(bloc.texte);
        break;
      case "lot":
        for (const article of bloc.articles) {
          lignes.push(
            `${article.designation} — ${article.quantite} — ${formatCurrency(article.montant)}${article.sort ? ` — ${article.sort}` : ""}`
          );
        }
        lignes.push(
          `${bloc.numero} — ${bloc.nature} — ${bloc.nbArticles} article${bloc.nbArticles > 1 ? "s" : ""} — ${formatCurrency(bloc.montant)}${bloc.issue ? ` — ${bloc.issue}` : ""}`
        );
        break;
      case "total":
        lignes.push(`Total : ${formatCurrency(bloc.montant)}`);
        break;
      case "liste":
        lignes.push(...bloc.items);
        break;
      case "encadre":
        for (const l of bloc.lignes) lignes.push(`${l.libelle} : ${l.valeur}`);
        break;
      case "pieces":
        lignes.push(mentionPieces(bloc.noms.length));
        break;
      case "signature":
        lignes.push("Cordialement,", "L'Or au Juste Prix");
        break;
    }
  }

  return lignes.join("\n");
}

/* ──────────────────────── CLOTURE D'UN DOSSIER ──────────────────────── */

export interface LigneRecap {
  numero: string;
  /** « rachat », « vente » ou « dépôt-vente », deja en clair. */
  nature: string;
  /** Ce qui est arrive au lot, quand ce n'est pas le deroulement normal. */
  issue: string | null;
  nbArticles: number;
  montant: number;
  articles: ArticleRecap[];
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
 *
 * Chaque lot montre d'abord ses articles, puis sa propre ligne en dessous, en
 * sous-total. Le recapitulatif ne donnait au depart que la ligne du lot : sur
 * un rachat ou un objet avait ete achete et l'autre refuse, le client lisait
 * « 2 articles » et un montant, sans pouvoir dire lequel des deux lui avait ete
 * paye.
 */
export function gabaritDossierCloture(recap: RecapCloture): Gabarit {
  const blocs: Bloc[] = [
    bonjour(recap.client),
    {
      type: "paragraphe",
      texte: `Votre dossier n°${recap.dossierNumero} est clôturé. Voici le récapitulatif de ce qui s'y est passé.`,
    },
  ];

  for (const lot of recap.lots) {
    blocs.push({
      type: "lot",
      numero: lot.numero,
      nature: lot.nature,
      issue: lot.issue,
      nbArticles: lot.nbArticles,
      montant: lot.montant,
      articles: lot.articles,
    });
  }

  // Le total n'a de sens qu'a plusieurs lots : repeter un montant unique deja
  // ecrit juste au-dessus donne l'impression d'une somme a payer en plus.
  if (recap.lots.length > 1) {
    blocs.push({
      type: "total",
      montant: recap.lots.reduce((somme, lot) => somme + lot.montant, 0),
    });
  }

  if (recap.documents.length > 0) {
    blocs.push({ type: "pieces", noms: recap.documents });
    blocs.push({
      type: "note",
      texte:
        "Conservez ces documents : ils vous seront demandés en cas de question sur cette opération.",
    });
  }

  blocs.push({ type: "signature" });

  return {
    sujet: `Votre dossier ${recap.dossierNumero} est clôturé — L'Or au Juste Prix`,
    blocs,
  };
}

/* ──────────────────────── DEVIS QUI EXPIRE ──────────────────────── */

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
    blocs: [
      bonjour(rappel.client),
      {
        type: "paragraphe",
        texte: `Votre devis${reference} porte sur ${articles}. Il arrive à échéance demain.`,
      },
      {
        type: "encadre",
        lignes: [
          { libelle: "Montant proposé", valeur: formatCurrency(rappel.montant), fort: true },
          { libelle: "Valable jusqu'au", valeur: formatDateTime(rappel.dateFin) },
        ],
      },
      {
        type: "paragraphe",
        texte:
          "Passé ce délai, le prix proposé ne pourra plus être garanti : il est calculé sur le cours des métaux au jour de l'estimation.",
      },
      {
        type: "paragraphe",
        texte: "Si vous souhaitez donner suite, il vous suffit de nous le faire savoir avant cette date.",
      },
      { type: "signature" },
    ],
  };
}

/* ──────────────────────── COMMANDE ARRIVEE ──────────────────────── */

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
  return {
    sujet: `Votre commande ${commande.lotNumero} est disponible — L'Or au Juste Prix`,
    blocs: [
      bonjour(commande.client),
      {
        type: "paragraphe",
        texte: "Bonne nouvelle : votre commande est arrivée et vous attend en boutique.",
      },
      { type: "liste", items: commande.articles },
      {
        type: "paragraphe",
        texte:
          "Vous pouvez venir la retirer aux horaires d'ouverture, muni d'une pièce d'identité.",
      },
      { type: "signature" },
    ],
  };
}

/* ──────────────────────── RAPPEL DE SOLDE ──────────────────────── */

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
    blocs: [
      bonjour(rappel.client),
      {
        type: "paragraphe",
        texte: `Nous vous rappelons que le solde de votre facture${reference} reste à régler.`,
      },
      {
        type: "encadre",
        lignes: [
          { libelle: "Reste à régler", valeur: formatCurrency(rappel.montantRestant), fort: true },
          { libelle: "Avant le", valeur: formatDate(rappel.dateLimite) },
        ],
      },
      { type: "paragraphe", texte: "Votre commande reste réservée jusqu'à cette date." },
      {
        type: "note",
        texte: "Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.",
      },
      { type: "signature" },
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
