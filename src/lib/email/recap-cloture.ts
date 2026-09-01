import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { envoyerCourriel, telechargerPieces, dossiersDejaNotifies } from "./envoyer";
import { gabaritDossierCloture, type LigneRecap, type RecapCloture, type Destinataire } from "./gabarits";
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
 */

/* ──────────────────────── COMPOSITION (pure) ──────────────────────── */

export interface LotClos {
  id: string;
  numero: string;
  type: LotType;
  outcome: LotOutcome | null;
  montant: number;
  nbArticles: number;
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

/* ──────────────────────── ENVOI ──────────────────────── */

interface LigneVente {
  lot_id: string;
  quantite: number;
  prix_total: number;
  montant_taxe: number;
  type_taxe: string | null;
}

interface RefLot {
  lot_id: string;
  quantite: number;
}

/**
 * Ce que le lot a represente pour le client.
 *
 * Sur un rachat ou un depot-vente, c'est ce qu'il touche : le net, taxe
 * forfaitaire deduite. Sur une vente, c'est ce qu'il paie — le prix affiche,
 * TVA comprise, puisqu'elle ne s'y ajoute jamais. Seule la TFOP des lignes
 * anciennes s'ajoutait vraiment au prix.
 */
function montantDuLot(
  lot: { id: string; type: LotType; montant_net: number },
  lignes: LigneVente[]
): number {
  if (lot.type !== "vente") return lot.montant_net;

  const total = lignes
    .filter((l) => l.lot_id === lot.id)
    .reduce((somme, l) => somme + l.prix_total + (l.type_taxe === "tfop" ? l.montant_taxe : 0), 0);

  return Math.round(total * 100) / 100;
}

/**
 * Envoie le recapitulatif de cloture, une fois pour toutes.
 *
 * L'appel est volontairement tolerant : il est declenche depuis les actions de
 * finalisation, ou toute exception remonterait jusqu'a l'ecran et laisserait
 * croire que la cloture a echoue alors qu'elle a bien eu lieu.
 */
export async function envoyerRecapCloture(dossierId: string): Promise<void> {
  try {
    const db = getSupabaseAdmin();

    // Un dossier ne se cloture qu'une fois, mais il est finalise depuis deux
    // chemins distincts et repris par le balayage horaire en cas d'echec :
    // sans cette garde, le client recevrait le meme recapitulatif trois fois.
    const dejaEcrit = await dossiersDejaNotifies("dossier_cloture");
    if (dejaEcrit.has(dossierId)) return;

    const { data: dossier } = await db
      .from("dossiers")
      .select("id, numero, status, client:clients(id, civility, first_name, last_name, email)")
      .eq("id", dossierId)
      .single();

    if (!dossier) return;

    const client = dossier.client as unknown as {
      id: string;
      civility: string | null;
      first_name: string;
      last_name: string;
      email: string | null;
    } | null;
    if (!client) return;

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
    if (lotsDuDossier.length === 0) return;

    const lotIds = lotsDuDossier.map((l) => l.id);

    const [{ data: lignes }, { data: refs }, { data: documents }] = await Promise.all([
      db
        .from("vente_lignes")
        .select("lot_id, quantite, prix_total, montant_taxe, type_taxe")
        .in("lot_id", lotIds),
      db.from("lot_references").select("lot_id, quantite").in("lot_id", lotIds),
      db
        .from("documents")
        .select("type, numero, storage_path")
        .eq("dossier_id", dossierId)
        .order("created_at", { ascending: true }),
    ]);

    const venteLignes = (lignes ?? []) as LigneVente[];
    const lotRefs = (refs ?? []) as RefLot[];

    const lotsClos: LotClos[] = lotsDuDossier.map((lot) => {
      const source = lot.type === "vente" ? venteLignes : lotRefs;
      const nbArticles = source
        .filter((l) => l.lot_id === lot.id)
        .reduce((somme, l) => somme + (l.quantite ?? 1), 0);

      return {
        id: lot.id,
        numero: lot.numero,
        type: lot.type,
        outcome: lot.outcome,
        montant: montantDuLot(lot, venteLignes),
        nbArticles,
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

    await envoyerCourriel({
      type: "dossier_cloture",
      destinataire: client.email ?? "",
      gabarit: gabaritDossierCloture(recap),
      pieces: await telechargerPieces(pieces),
      dossierId,
      clientId: client.id,
    });
  } catch (err) {
    // La cloture a eu lieu ; seul le courriel a manque. Le balayage horaire
    // repassera, et l'echec est deja trace.
    console.error("[courriel] récapitulatif de clôture en échec :", err);
  }
}
