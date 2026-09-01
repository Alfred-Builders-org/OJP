/**
 * Qui doit recevoir un courriel, et quand.
 *
 * Trois des quatre courriels ne repondent pas a un clic : ils repondent au
 * temps qui passe ou a un etat atteint sans que personne n'ait rien declenche.
 * Un balayage horaire les detecte. Ces fonctions en sont le coeur, et elles
 * sont pures : on leur donne des lignes deja lues et l'heure qu'il est, elles
 * rendent la liste de ce qui doit partir.
 *
 * Ce decoupage n'est pas de la coquetterie. La regle « a la moitie du delai »
 * ou « seulement quand le dernier article est arrive » se verifie ici en
 * quelques millisecondes, sur des cas limites qu'on ne saurait pas provoquer en
 * base — un devis qui expire dans 23 h 59, un lot dont la derniere ligne vient
 * d'arriver, un solde regle a un centime pres.
 *
 * L'idempotence, elle, vient de `dejaNotifies` : l'ensemble des lots ayant deja
 * reçu ce courriel, lu dans `email_logs`. Sans lui, un balayage horaire
 * enverrait le meme rappel vingt-quatre fois.
 */

const HEURE_MS = 60 * 60 * 1000;

/** Fenetre du rappel de devis : la derniere journee avant l'echeance. */
const PREAVIS_DEVIS_MS = 24 * HEURE_MS;

/* ──────────────────────── DEVIS QUI EXPIRENT ──────────────────────── */

export interface RefDevis {
  lot_id: string;
  status: string;
  date_fin_delai: string | null;
  prix_achat: number;
  montant_taxe: number;
  quantite: number;
}

export interface DevisAEnvoyer {
  lotId: string;
  nbArticles: number;
  /** Net propose au client, calcule comme sur le devis lui-meme. */
  montant: number;
  /** La plus proche des echeances du lot : c'est elle qui presse. */
  dateFin: string;
}

/**
 * Devis dont l'echeance tombe dans les vingt-quatre heures.
 *
 * Un lot peut porter plusieurs references en attente de reponse, chacune avec
 * sa propre echeance. Elles sont pourtant nees du meme devis et du meme
 * document : le rappel est donc groupe par lot, et retient l'echeance la plus
 * proche. Envoyer un courriel par reference reviendrait a ecrire trois fois au
 * meme client pour le meme papier.
 *
 * Un devis deja expire ne declenche rien : rappeler une echeance passee ne
 * laisse aucune main au client, et le prix n'est de toute façon plus tenu.
 */
export function devisQuiExpirent(
  refs: RefDevis[],
  maintenant: Date,
  dejaNotifies: Set<string> = new Set()
): DevisAEnvoyer[] {
  const parLot = new Map<string, RefDevis[]>();

  for (const ref of refs) {
    if (ref.status !== "devis_envoye" || !ref.date_fin_delai) continue;
    if (dejaNotifies.has(ref.lot_id)) continue;

    const fin = new Date(ref.date_fin_delai).getTime();
    if (Number.isNaN(fin)) continue;

    const restant = fin - maintenant.getTime();
    if (restant <= 0 || restant > PREAVIS_DEVIS_MS) continue;

    const existantes = parLot.get(ref.lot_id) ?? [];
    existantes.push(ref);
    parLot.set(ref.lot_id, existantes);
  }

  const envois: DevisAEnvoyer[] = [];

  for (const [lotId, lignes] of parLot) {
    const brut = lignes.reduce((somme, r) => somme + r.prix_achat * r.quantite, 0);
    const taxe = lignes.reduce((somme, r) => somme + r.montant_taxe * r.quantite, 0);
    const echeances = lignes
      .map((r) => new Date(r.date_fin_delai as string).getTime())
      .sort((a, b) => a - b);

    envois.push({
      lotId,
      nbArticles: lignes.reduce((somme, r) => somme + r.quantite, 0),
      montant: Math.round((brut - taxe) * 100) / 100,
      dateFin: new Date(echeances[0]).toISOString(),
    });
  }

  return envois;
}

/* ──────────────────────── COMMANDES ARRIVEES ──────────────────────── */

export interface LigneCommande {
  lot_id: string;
  designation: string;
  fulfillment: string;
  is_livre: boolean;
}

export interface CommandeAEnvoyer {
  lotId: string;
  /** Ce qui attend le client au comptoir, dans l'ordre de la commande. */
  articles: string[];
}

/** Un article est disponible s'il est arrive, ou s'il sortait deja du stock. */
const DISPONIBLES = ["recu", "servi_stock"];

/**
 * Lots de vente dont tous les articles sont arrives.
 *
 * La condition n'est pas « un article est arrive » mais « plus rien n'est
 * attendu » : une commande de trois bijoux dont deux sont la ne fait pas venir
 * le client, elle le fait revenir deux fois.
 *
 * Il faut de plus qu'au moins un article ait ete commande puis reçu. Un panier
 * entierement servi depuis la vitrine n'est pas une commande : le client est
 * reparti avec, lui annoncer que « sa commande est arrivee » n'aurait aucun
 * sens.
 *
 * Enfin, un lot dont tout a deja ete remis ne declenche rien — le courriel
 * arriverait apres le client.
 */
export function commandesPretes(
  lignes: LigneCommande[],
  dejaNotifies: Set<string> = new Set()
): CommandeAEnvoyer[] {
  const parLot = new Map<string, LigneCommande[]>();

  for (const ligne of lignes) {
    if (dejaNotifies.has(ligne.lot_id)) continue;
    const existantes = parLot.get(ligne.lot_id) ?? [];
    existantes.push(ligne);
    parLot.set(ligne.lot_id, existantes);
  }

  const envois: CommandeAEnvoyer[] = [];

  for (const [lotId, lotLignes] of parLot) {
    const toutArrive = lotLignes.every((l) => DISPONIBLES.includes(l.fulfillment));
    if (!toutArrive) continue;

    const auMoinsUneCommandee = lotLignes.some((l) => l.fulfillment === "recu");
    if (!auMoinsUneCommandee) continue;

    const aRetirer = lotLignes.filter((l) => !l.is_livre);
    if (aRetirer.length === 0) continue;

    envois.push({ lotId, articles: aRetirer.map((l) => l.designation) });
  }

  return envois;
}

/* ──────────────────────── SOLDES A RAPPELER ──────────────────────── */

export interface SoldeEnAttente {
  lot_id: string;
  /** Echeance de reglement, telle que posee a l'emission de la facture. */
  date_limite_solde: string | null;
  factureNumero: string | null;
  montantAttendu: number;
  montantPaye: number;
}

export interface RappelSoldeAEnvoyer {
  lotId: string;
  factureNumero: string | null;
  montantRestant: number;
  dateLimite: string;
}

/**
 * Soldes a rappeler, a la moitie du delai accorde.
 *
 * Le delai de reglement du solde est un reglage de la boutique
 * (`solde_delai_heures`). Le rappel tombe exactement a sa moitie : sur un delai
 * de quarante-huit heures, vingt-quatre heures avant l'echeance. C'est assez
 * tot pour qu'un virement parte, et assez tard pour ne pas relancer quelqu'un
 * qui vient de signer.
 *
 * Passe l'echeance, plus rien n'est envoye : la relance d'un impaye est une
 * conversation, pas un courriel automatique.
 *
 * La regle vaut que la vente ait comporte un acompte ou non. Quand le comptoir
 * choisit de s'en passer, la facture unique porte la meme echeance, et le
 * client merite le meme rappel.
 */
export function soldesARappeler(
  soldes: SoldeEnAttente[],
  delaiHeures: number,
  maintenant: Date,
  dejaNotifies: Set<string> = new Set()
): RappelSoldeAEnvoyer[] {
  // Un delai absent ou absurde ne doit pas faire partir tous les rappels d'un
  // coup : sans duree connue, on ne sait pas ou est la moitie.
  if (!Number.isFinite(delaiHeures) || delaiHeures <= 0) return [];

  const preavisMs = (delaiHeures / 2) * HEURE_MS;
  const envois: RappelSoldeAEnvoyer[] = [];

  for (const solde of soldes) {
    if (dejaNotifies.has(solde.lot_id) || !solde.date_limite_solde) continue;

    const limite = new Date(solde.date_limite_solde).getTime();
    if (Number.isNaN(limite)) continue;

    const restant = limite - maintenant.getTime();
    if (restant <= 0 || restant > preavisMs) continue;

    // Le centime d'ecart vient des arrondis de TVA : le reclamer donnerait un
    // rappel pour zero euro.
    const dette = Math.round((solde.montantAttendu - solde.montantPaye) * 100) / 100;
    if (dette < 0.01) continue;

    envois.push({
      lotId: solde.lot_id,
      factureNumero: solde.factureNumero,
      montantRestant: dette,
      dateLimite: solde.date_limite_solde,
    });
  }

  return envois;
}
