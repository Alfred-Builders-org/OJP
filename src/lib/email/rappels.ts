import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { envoyerCourriel, lotsDejaNotifies } from "./envoyer";
import {
  devisQuiExpirent,
  commandesPretes,
  soldesARappeler,
  type RefDevis,
  type LigneCommande,
  type SoldeEnAttente,
} from "./balayage";
import {
  gabaritDevisExpireBientot,
  gabaritCommandePrete,
  gabaritRappelSolde,
  type Destinataire,
} from "./gabarits";
import type { BusinessRulesSettings } from "@/types/settings";

/**
 * Le balayage : ce que l'application regarde toutes les heures.
 *
 * Trois des quatre courriels ne repondent a aucun clic. Un devis expire parce
 * que le temps passe, une commande devient complete parce que le dernier
 * article est arrive, un solde approche de son echeance. Rien de tout cela ne
 * traverse le code applicatif au moment ou ça se produit — il faut aller voir.
 *
 * Ce balayage est appele par `pg_cron` a travers la route `/api/cron/emails`.
 * L'ordonnanceur vit donc dans la base, mais la regle et le texte restent ici,
 * en TypeScript : ecrire un gabarit en SQL reviendrait a en avoir deux, et
 * c'est toujours celui qu'on ne relit pas qui part au client.
 *
 * Le balayage est idempotent : il peut tourner deux fois dans l'heure sans
 * ecrire deux fois au meme client. C'est `email_logs` qui l'en empeche.
 */

export interface RapportBalayage {
  devis: number;
  commandes: number;
  soldes: number;
  echecs: number;
}

/** Le delai de reglement du solde, tel que la boutique l'a regle. */
const SOLDE_DELAI_DEFAUT_H = 48;

interface ClientLot {
  destinataire: Destinataire;
  email: string | null;
  clientId: string;
  dossierId: string;
}

export async function executerBalayage(maintenant: Date = new Date()): Promise<RapportBalayage> {
  const db = getSupabaseAdmin();
  const rapport: RapportBalayage = { devis: 0, commandes: 0, soldes: 0, echecs: 0 };

  const { data: reglages } = await db
    .from("settings")
    .select("value")
    .eq("key", "business_rules")
    .single();
  const regles = reglages?.value as BusinessRulesSettings | undefined;
  const delaiSolde = regles?.solde_delai_heures ?? SOLDE_DELAI_DEFAUT_H;

  /* ── Devis sur le point d'expirer ── */

  const { data: refs } = await db
    .from("lot_references")
    .select("lot_id, status, date_fin_delai, prix_achat, montant_taxe, quantite")
    .eq("status", "devis_envoye")
    .not("date_fin_delai", "is", null);

  const devis = devisQuiExpirent(
    (refs ?? []) as RefDevis[],
    maintenant,
    await lotsDejaNotifies("devis_expire_bientot")
  );

  if (devis.length > 0) {
    const clients = await clientsDesLots(devis.map((d) => d.lotId));
    const numeros = await numerosDeDocument(devis.map((d) => d.lotId), "devis_rachat");

    for (const envoi of devis) {
      const client = clients.get(envoi.lotId);
      if (!client) continue;

      const { envoye } = await envoyerCourriel({
        type: "devis_expire_bientot",
        destinataire: client.email ?? "",
        gabarit: gabaritDevisExpireBientot({
          client: client.destinataire,
          devisNumero: numeros.get(envoi.lotId) ?? null,
          nbArticles: envoi.nbArticles,
          montant: envoi.montant,
          dateFin: envoi.dateFin,
        }),
        lotId: envoi.lotId,
        dossierId: client.dossierId,
        clientId: client.clientId,
      });

      if (envoye) rapport.devis++;
      else rapport.echecs++;
    }
  }

  /* ── Commandes arrivees en boutique ── */

  const { data: lotsVente } = await db
    .from("lots")
    .select("id")
    .eq("type", "vente")
    .eq("status", "en_cours");

  const idsVente = (lotsVente ?? []).map((l: { id: string }) => l.id);

  if (idsVente.length > 0) {
    const { data: lignes } = await db
      .from("vente_lignes")
      .select("lot_id, designation, fulfillment, is_livre")
      .in("lot_id", idsVente);

    const commandes = commandesPretes(
      (lignes ?? []) as LigneCommande[],
      await lotsDejaNotifies("commande_prete")
    );

    if (commandes.length > 0) {
      const clients = await clientsDesLots(commandes.map((c) => c.lotId));
      const numeros = await numerosDeLot(commandes.map((c) => c.lotId));

      for (const envoi of commandes) {
        const client = clients.get(envoi.lotId);
        if (!client) continue;

        const { envoye } = await envoyerCourriel({
          type: "commande_prete",
          destinataire: client.email ?? "",
          gabarit: gabaritCommandePrete({
            client: client.destinataire,
            lotNumero: numeros.get(envoi.lotId) ?? "",
            articles: envoi.articles,
          }),
          lotId: envoi.lotId,
          dossierId: client.dossierId,
          clientId: client.clientId,
        });

        if (envoye) rapport.commandes++;
        else rapport.echecs++;
      }
    }
  }

  /* ── Soldes a rappeler ── */

  const { data: lotsSolde } = await db
    .from("lots")
    .select("id, date_limite_solde")
    .eq("status", "en_cours")
    .not("date_limite_solde", "is", null);

  const idsSolde = (lotsSolde ?? []).map((l: { id: string }) => l.id);

  if (idsSolde.length > 0) {
    const [{ data: factures }, { data: reglements }] = await Promise.all([
      db.from("factures").select("lot_id, montant_ttc").in("lot_id", idsSolde),
      db.from("reglements").select("lot_id, type, sens, montant").in("lot_id", idsSolde),
    ]);

    const numerosSolde = await numerosDeDocument(idsSolde, "facture_solde");

    // Ce que le client doit sur le lot : toutes ses factures. Ce qu'il a verse :
    // ses reglements entrants. La difference vaut aussi bien pour une vente
    // avec acompte que pour une vente reglee d'un seul trait — le comptoir peut
    // se passer de l'acompte, l'echeance reste.
    const soldes: SoldeEnAttente[] = (lotsSolde ?? []).map(
      (lot: { id: string; date_limite_solde: string | null }) => ({
        lot_id: lot.id,
        date_limite_solde: lot.date_limite_solde,
        factureNumero: numerosSolde.get(lot.id) ?? null,
        montantAttendu: (factures ?? [])
          .filter((f: { lot_id: string }) => f.lot_id === lot.id)
          .reduce((somme: number, f: { montant_ttc: number }) => somme + f.montant_ttc, 0),
        montantPaye: (reglements ?? [])
          .filter(
            (r: { lot_id: string; sens: string }) => r.lot_id === lot.id && r.sens === "entrant"
          )
          .reduce((somme: number, r: { montant: number }) => somme + r.montant, 0),
      })
    );

    const rappels = soldesARappeler(
      soldes,
      delaiSolde,
      maintenant,
      await lotsDejaNotifies("rappel_solde")
    );

    if (rappels.length > 0) {
      const clients = await clientsDesLots(rappels.map((r) => r.lotId));

      for (const envoi of rappels) {
        const client = clients.get(envoi.lotId);
        if (!client) continue;

        const { envoye } = await envoyerCourriel({
          type: "rappel_solde",
          destinataire: client.email ?? "",
          gabarit: gabaritRappelSolde({
            client: client.destinataire,
            factureNumero: envoi.factureNumero,
            montantRestant: envoi.montantRestant,
            dateLimite: envoi.dateLimite,
          }),
          lotId: envoi.lotId,
          dossierId: client.dossierId,
          clientId: client.clientId,
        });

        if (envoye) rapport.soldes++;
        else rapport.echecs++;
      }
    }
  }

  // Aucun rattrapage des clotures, volontairement.
  //
  // Le balayage avait d'abord repris les dossiers clos recemment dont le
  // recapitulatif n'etait pas parti. A la premiere execution, trente dossiers
  // deja clos depuis des jours auraient ecrit d'un coup a des clients qui
  // avaient tourne la page. Reduire la fenetre ne reglait rien : le principe
  // meme est mauvais. Un courriel qui n'est pas parti au bon moment ne doit
  // plus partir du tout — il se rattrape a la voix, pas par un automate qui
  // remonte le temps.
  //
  // Le recapitulatif de cloture part donc d'un seul endroit : le moment ou le
  // dossier se clot. S'il echoue, l'echec est trace dans `email_logs`, et
  // c'est tout.

  return rapport;
}

/* ──────────────────────── LECTURES D'APPOINT ──────────────────────── */

/**
 * A qui ecrire, pour chacun de ces lots.
 *
 * Le client n'est pas porte par le lot mais par le dossier qui le contient : il
 * faut donc remonter d'un cran. La jointure est faite en une requete, pas une
 * par lot — un balayage horaire qui reveille la base cent fois pour cent lots
 * finit par se voir.
 */
async function clientsDesLots(lotIds: string[]): Promise<Map<string, ClientLot>> {
  const resultat = new Map<string, ClientLot>();
  if (lotIds.length === 0) return resultat;

  const { data } = await getSupabaseAdmin()
    .from("lots")
    .select("id, dossier:dossiers(id, client:clients(id, civility, first_name, last_name, email))")
    .in("id", lotIds);

  for (const ligne of (data ?? []) as unknown as {
    id: string;
    dossier: {
      id: string;
      client: {
        id: string;
        civility: string | null;
        first_name: string;
        last_name: string;
        email: string | null;
      } | null;
    } | null;
  }[]) {
    const client = ligne.dossier?.client;
    if (!client) continue;

    resultat.set(ligne.id, {
      destinataire: {
        civilite: client.civility,
        prenom: client.first_name,
        nom: client.last_name,
      },
      email: client.email,
      clientId: client.id,
      dossierId: ligne.dossier!.id,
    });
  }

  return resultat;
}

/** Le numero de la piece d'un type donne, la plus recente de chaque lot. */
async function numerosDeDocument(
  lotIds: string[],
  type: string
): Promise<Map<string, string>> {
  const resultat = new Map<string, string>();
  if (lotIds.length === 0) return resultat;

  const { data } = await getSupabaseAdmin()
    .from("documents")
    .select("lot_id, numero")
    .in("lot_id", lotIds)
    .eq("type", type)
    .order("created_at", { ascending: false });

  for (const doc of (data ?? []) as { lot_id: string; numero: string | null }[]) {
    if (doc.numero && !resultat.has(doc.lot_id)) resultat.set(doc.lot_id, doc.numero);
  }

  return resultat;
}

/** Le numero du lot lui-meme, celui que le client lit sur ses documents. */
async function numerosDeLot(lotIds: string[]): Promise<Map<string, string>> {
  const resultat = new Map<string, string>();
  if (lotIds.length === 0) return resultat;

  const { data } = await getSupabaseAdmin().from("lots").select("id, numero").in("id", lotIds);

  for (const lot of (data ?? []) as { id: string; numero: string }[]) {
    resultat.set(lot.id, lot.numero);
  }

  return resultat;
}
