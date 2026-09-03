import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { envoyerCourriel, telechargerPieces, dossiersDejaNotifies } from "./envoyer";
import {
  gabaritDossierCloture,
  type ArticleRecap,
  type Gabarit,
  type LigneRecap,
  type RecapCloture,
  type Destinataire,
} from "./gabarits";
import type { DocumentType } from "@/types/document";
import type { LotType, LotOutcome } from "@/types/lot";

/**
 * Le recapitulatif envoye a la cloture d'un dossier.
 *
 * C'est le seul courriel qui parte sur-le-champ : les trois autres repondent au
 * temps qui passe, celui-ci repond a un geste. Il porte en pieces jointes tout
 * ce qui a ete emis au nom du client pendant le dossier — contrat, quittance,
 * factures — parce que c'est le moment ou il classe l'affaire, et le moment ou
 * il aura le plus de mal a revenir les chercher.
 *
 * Il ne part qu'a cet instant-la. Aucun balayage ne le rattrape : un courriel
 * qui n'est pas parti au bon moment ne doit plus partir du tout.
 */

/* ──────────────────────── COMPOSITION (pure) ──────────────────────── */

export interface LotClos {
  id: string;
  numero: string;
  type: LotType;
  outcome: LotOutcome | null;
  montant: number;
  nbArticles: number;
  articles: ArticleRecap[];
}

export interface DocumentClos {
  type: DocumentType;
  numero: string | null;
  storage_path: string;
}

const NATURES: Record<LotType, string> = {
  rachat: "rachat",
  vente: "vente",
  depot_vente: "dépôt-vente",
  fonte: "fonte",
};

/**
 * Ce qui est arrive au lot, quand ce n'est pas le deroulement normal.
 *
 * Un lot mene a terme ne merite aucune mention : ecrire « abouti » sur chaque
 * ligne noierait la seule qui compte, celle du lot qui n'a pas abouti.
 */
const ISSUES: Record<LotOutcome, string | null> = {
  complete: null,
  refuse: "devis refusé",
  retracte: "rétracté",
  annule: "annulé",
};

/**
 * Le sort d'un article, quand il differe de l'achat ordinaire.
 *
 * C'est ce qui permet de lire un lot mixte : sur un rachat ou un objet a ete
 * achete au comptoir et l'autre laisse au devis puis refuse, la ligne du lot ne
 * dit que « 2 articles » et un montant. Le detail, lui, nomme le refus.
 */
const SORTS: Record<string, string | null> = {
  finalise: null,
  vendu: null,
  en_attente_paiement: null,
  devis_refuse: "devis refusé",
  devis_envoye: "devis sans réponse",
  retracte: "rétracté",
  rendu_client: "restitué",
};

/** Les pieces emises au nom du client, et leur nom en clair. */
const PIECES_CLIENT: Partial<Record<DocumentType, string>> = {
  contrat_rachat: "Contrat de rachat",
  quittance_rachat: "Quittance de rachat",
  devis_rachat: "Devis de rachat",
  contrat_depot_vente: "Contrat de dépôt-vente",
  confie_achat: "Confié achat",
  quittance_depot_vente: "Quittance de dépôt-vente",
  facture_vente: "Facture",
  facture_acompte: "Facture d'acompte",
  facture_solde: "Facture de solde",
  remboursement_retractation: "Reçu de remboursement",
};

/** Nom du fichier tel que le client le verra dans sa messagerie. */
export function nommerPiece(doc: DocumentClos): string | null {
  const libelle = PIECES_CLIENT[doc.type];
  if (!libelle) return null;
  return doc.numero ? `${libelle} ${doc.numero}.pdf` : `${libelle}.pdf`;
}

/**
 * Assemble le recapitulatif.
 *
 * Les bons de commande et de livraison sont ecartes : ce sont des pieces
 * echangees avec la fonderie, et le prix d'achat qu'elles portent n'a rien a
 * faire entre les mains du client.
 */
export function composerRecap(
  client: Destinataire,
  dossierNumero: string,
  lots: LotClos[],
  documents: DocumentClos[]
): { recap: RecapCloture; pieces: { path: string; nom: string }[] } {
  const lignes: LigneRecap[] = lots.map((lot) => ({
    numero: lot.numero,
    nature: NATURES[lot.type] ?? lot.type,
    issue: lot.outcome ? ISSUES[lot.outcome] ?? null : null,
    nbArticles: lot.nbArticles,
    montant: lot.montant,
    articles: lot.articles,
  }));

  const pieces: { path: string; nom: string }[] = [];
  for (const doc of documents) {
    const nom = nommerPiece(doc);
    if (nom && doc.storage_path) pieces.push({ path: doc.storage_path, nom });
  }

  return {
    recap: {
      client,
      dossierNumero,
      lots: lignes,
      documents: pieces.map((p) => p.nom),
    },
    pieces,
  };
}

/* ──────────────────────── LECTURE ──────────────────────── */

interface LigneVente {
  lot_id: string;
  designation: string | null;
  quantite: number;
  prix_total: number;
  montant_taxe: number;
  type_taxe: string | null;
}

interface RefLot {
  lot_id: string;
  designation: string | null;
  quantite: number;
  prix_achat: number;
  montant_taxe: number;
  status: string;
}

/**
 * Ce qu'un article de vente coute au client : le prix affiche.
 *
 * La TVA ne s'y ajoute jamais, qu'elle porte sur la marge ou sur le prix
 * entier. Seule la TFOP des lignes anciennes s'ajoutait vraiment au prix.
 */
function montantLigneVente(ligne: LigneVente): number {
  return ligne.prix_total + (ligne.type_taxe === "tfop" ? ligne.montant_taxe : 0);
}

/** Ce qu'un article rachete rapporte au client : le net, taxe deduite. */
function montantReference(ref: RefLot): number {
  return (ref.prix_achat - ref.montant_taxe) * ref.quantite;
}

export interface RecapPret {
  gabarit: Gabarit;
  pieces: { path: string; nom: string }[];
  clientId: string;
  email: string | null;
}

/**
 * Rassemble tout ce qu'il faut pour ecrire au client, sans rien envoyer.
 *
 * Separe de l'envoi pour une raison simple : c'est ce qui permet de composer un
 * recapitulatif reel — vrais lots, vrais articles, vraies pieces — et de le
 * regarder ailleurs que dans la boite du client.
 */
export async function preparerRecapCloture(dossierId: string): Promise<RecapPret | null> {
  const db = getSupabaseAdmin();

  const { data: dossier } = await db
    .from("dossiers")
    .select("id, numero, client:clients(id, civility, first_name, last_name, email)")
    .eq("id", dossierId)
    .single();

  if (!dossier) return null;

  const client = dossier.client as unknown as {
    id: string;
    civility: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  if (!client) return null;

  const { data: lots } = await db
    .from("lots")
    .select("id, numero, type, outcome, montant_net")
    .eq("dossier_id", dossierId);

  const lotsDuDossier = (lots ?? []) as {
    id: string;
    numero: string;
    type: LotType;
    outcome: LotOutcome | null;
    montant_net: number;
  }[];
  if (lotsDuDossier.length === 0) return null;

  const lotIds = lotsDuDossier.map((l) => l.id);

  const [{ data: lignes }, { data: refs }, { data: documents }] = await Promise.all([
    db
      .from("vente_lignes")
      .select("lot_id, designation, quantite, prix_total, montant_taxe, type_taxe")
      .in("lot_id", lotIds),
    db
      .from("lot_references")
      .select("lot_id, designation, quantite, prix_achat, montant_taxe, status")
      .in("lot_id", lotIds),
    db
      .from("documents")
      .select("type, numero, storage_path")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true }),
  ]);

  const venteLignes = (lignes ?? []) as LigneVente[];
  const lotRefs = (refs ?? []) as RefLot[];

  const lotsClos: LotClos[] = lotsDuDossier.map((lot) => {
    const articles: ArticleRecap[] =
      lot.type === "vente"
        ? venteLignes
            .filter((l) => l.lot_id === lot.id)
            .map((l) => ({
              designation: l.designation ?? "Article",
              quantite: l.quantite ?? 1,
              montant: Math.round(montantLigneVente(l) * 100) / 100,
              sort: null,
            }))
        : lotRefs
            .filter((r) => r.lot_id === lot.id)
            .map((r) => ({
              designation: r.designation ?? "Article",
              quantite: r.quantite ?? 1,
              montant: Math.round(montantReference(r) * 100) / 100,
              sort: SORTS[r.status] ?? null,
            }));

    // Le montant du lot se deduit de ses articles plutot que du champ
    // `montant_net` : sur un lot mixte, ou une partie a ete refusee, les deux
    // ne coincident pas toujours, et c'est la somme du detail affiche qui doit
    // faire foi. Un total qui ne tombe pas juste sous les lignes qu'il resume
    // est le genre de detail qui fait douter de tout le reste.
    const montant = articles.reduce((somme, a) => somme + a.montant, 0);

    return {
      id: lot.id,
      numero: lot.numero,
      type: lot.type,
      outcome: lot.outcome,
      montant: Math.round(montant * 100) / 100,
      nbArticles: articles.reduce((somme, a) => somme + a.quantite, 0),
      articles,
    };
  });

  const { recap, pieces } = composerRecap(
    {
      civilite: client.civility,
      prenom: client.first_name,
      nom: client.last_name,
    },
    dossier.numero as string,
    lotsClos,
    (documents ?? []) as DocumentClos[]
  );

  return {
    gabarit: gabaritDossierCloture(recap),
    pieces,
    clientId: client.id,
    email: client.email,
  };
}

/* ──────────────────────── ENVOI ──────────────────────── */

/**
 * Envoie le recapitulatif de cloture, une fois pour toutes.
 *
 * L'appel est volontairement tolerant : il est declenche depuis les actions de
 * finalisation, ou toute exception remonterait jusqu'a l'ecran et laisserait
 * croire que la cloture a echoue alors qu'elle a bien eu lieu.
 */
export async function envoyerRecapCloture(dossierId: string): Promise<void> {
  try {
    // Un dossier ne se cloture qu'une fois, mais il est finalise depuis deux
    // chemins distincts : sans cette garde, le client recevrait le meme
    // recapitulatif deux fois.
    const dejaEcrit = await dossiersDejaNotifies("dossier_cloture");
    if (dejaEcrit.has(dossierId)) return;

    const pret = await preparerRecapCloture(dossierId);
    if (!pret) return;

    await envoyerCourriel({
      type: "dossier_cloture",
      destinataire: pret.email ?? "",
      gabarit: pret.gabarit,
      pieces: await telechargerPieces(pret.pieces),
      dossierId,
      clientId: pret.clientId,
    });
  } catch (err) {
    // La cloture a eu lieu ; seul le courriel a manque. L'echec est trace dans
    // `email_logs`, et personne ne le rejouera.
    console.error("[courriel] récapitulatif de clôture en échec :", err);
  }
}
