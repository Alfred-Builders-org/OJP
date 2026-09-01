import type { Lot, LotReference } from "@/types/lot";
import type { VenteLigne } from "@/types/vente";
import type { Reglement, ReglementType, ReglementSens } from "@/types/reglement";
import type { BonCommande } from "@/types/bon-commande";
import type { DocumentRecord } from "@/types/document";

export interface PaymentDuePreFill {
  type: ReglementType;
  sens: ReglementSens;
  montant: number;
  client_id?: string;
  fonderie_id?: string;
  bon_commande_id?: string;
  document_id?: string;
}

export interface PaymentDue {
  type: ReglementType;
  sens: ReglementSens;
  label: string;
  description: string;
  montant_attendu: number;
  montant_deja_paye: number;
  montant_restant: number;
  is_fully_paid: boolean;
  pre_fill: PaymentDuePreFill;
}

/**
 * Somme des reglements d'un type, dans un sens donne.
 *
 * Le sens n'etait pas filtre : sur un lot retracte, le remboursement rentre par
 * le client annulait arithmetiquement le versement initial, le « deja paye »
 * retombait a zero et la dette reapparaissait entiere.
 */
function sumReglements(
  reglements: Reglement[],
  type: ReglementType,
  sens?: ReglementSens
): number {
  return reglements
    .filter((r) => r.type === type && (sens === undefined || r.sens === sens))
    .reduce((sum, r) => sum + r.montant, 0);
}

/**
 * Une operation close ne doit plus rien : ni au client, ni de sa part.
 *
 * La base refuse deja d'enregistrer un versement sur un lot sans suite
 * (migration 135). Sans ce garde-fou cote lecture, l'interface reclamait
 * pourtant le paiement, et le clic se soldait par une erreur PostgreSQL.
 */
const OUTCOMES_SANS_SUITE = ["retracte", "refuse", "annule"];

function estSansSuite(lot: Lot): boolean {
  return lot.outcome !== null && OUTCOMES_SANS_SUITE.includes(lot.outcome);
}

const DOC_TYPE_MAP: Record<string, string> = {
  vente: "facture_vente",
  acompte: "facture_acompte",
  solde: "facture_solde",
  rachat: "quittance_rachat",
  depot_vente: "quittance_depot_vente",
};

function findDocument(documents: DocumentRecord[], lotId: string, reglementType: string): DocumentRecord | undefined {
  const docType = DOC_TYPE_MAP[reglementType];
  if (!docType) return undefined;
  const candidates = documents.filter((d) => d.lot_id === lotId && d.type === docType);
  return candidates.find((d) => d.status !== "regle") ?? candidates[0];
}

/**
 * Le document qu'un remboursement de retractation solde est le recu emis a la
 * retractation, et non la quittance de rachat — celle-ci atteste du versement
 * inverse. Faute de le viser, le recu restait « en attente » a vie et le
 * reglement encaisse n'etait rattache a aucune piece.
 */
function findRecuRetractation(
  documents: DocumentRecord[],
  lotId: string
): DocumentRecord | undefined {
  const candidates = documents.filter(
    (d) => d.lot_id === lotId && d.type === "remboursement_retractation"
  );
  return candidates.find((d) => d.status !== "regle") ?? candidates[0];
}

function findDocumentId(documents: DocumentRecord[], lotId: string, reglementType: string): string | undefined {
  const docType = DOC_TYPE_MAP[reglementType];
  if (!docType) return undefined;
  const candidates = documents.filter((d) => d.lot_id === lotId && d.type === docType);
  // Prefer a document that is not yet "regle" (useful for mixed lots with multiple quittances)
  return candidates.find((d) => d.status !== "regle")?.id ?? candidates[0]?.id;
}

interface DetectParams {
  lot: Lot;
  lignes?: VenteLigne[];
  lotReferences?: LotReference[];
  reglements: Reglement[];
  bonsCommande?: BonCommande[];
  documents?: DocumentRecord[];
  clientId?: string;
  acompte_pct?: number;
}

export function detectPaymentsDue({
  lot,
  lignes = [],
  lotReferences = [],
  reglements,
  bonsCommande = [],
  documents = [],
  clientId,
  acompte_pct = 10,
}: DetectParams): PaymentDue[] {
  const payments: PaymentDue[] = [];

  // --- RACHAT en_cours : paiement par quittance non réglée ---
  if (lot.type === "rachat" && lot.status === "en_cours") {
    const unregedQuittances = documents.filter(
      (d) => d.lot_id === lot.id && d.type === "quittance_rachat" && d.status !== "regle"
    );
    for (const quittanceDoc of unregedQuittances) {
      // Find refs linked to this quittance that are en_attente_paiement
      const docWithRefs = quittanceDoc as { document_references?: { lot_reference_id: string }[] };
      const linkedRefIds = new Set(
        (docWithRefs.document_references ?? []).map((dr) => dr.lot_reference_id)
      );
      const linkedRefs = lotReferences.filter(
        (r) => linkedRefIds.has(r.id) && r.status === "en_attente_paiement"
      );
      if (linkedRefs.length === 0) continue;

      const attendu = linkedRefs.reduce(
        (sum, r) => sum + (r.prix_achat - r.montant_taxe) * r.quantite,
        0
      );
      const dejaPaye = reglements
        .filter((r) => r.type === "rachat" && r.document_id === quittanceDoc.id)
        .reduce((sum, r) => sum + r.montant, 0);
      const restant = Math.round(Math.max(0, attendu - dejaPaye) * 100) / 100;
      payments.push({
        type: "rachat",
        sens: "sortant",
        label: `Quittance ${quittanceDoc.numero} | Paiement client à effectuer`,
        description: "Montant net de la quittance de rachat à verser au client",
        montant_attendu: attendu,
        montant_deja_paye: dejaPaye,
        montant_restant: restant,
        is_fully_paid: restant < 0.01,
        pre_fill: {
          type: "rachat",
          sens: "sortant",
          montant: restant,
          client_id: clientId,
          document_id: quittanceDoc.id,
        },
      });
    }
  }

  // --- RACHAT en retractation : paiement anticipe ---
  // En boutique, le client repart le plus souvent avec son argent le jour meme,
  // alors que le delai legal de retractation court encore. On propose donc le
  // reglement des references en retractation, sans attendre la finalisation.
  // S'il se retracte ensuite, le remboursement se saisit en reglement negatif.
  if (lot.type === "rachat" && lot.status === "en_cours") {
    const refsEnRetractation = lotReferences.filter(
      (r) => r.status === "en_retractation"
    );

    if (refsEnRetractation.length > 0) {
      const contrats = documents.filter(
        (d) => d.lot_id === lot.id && d.type === "contrat_rachat"
      );
      // Comme pour les quittances : on vise le contrat encore en attente.
      const contrat = contrats.find((d) => d.status !== "regle") ?? contrats[0];
      const attendu = refsEnRetractation.reduce(
        (sum, r) => sum + (r.prix_achat - r.montant_taxe) * r.quantite,
        0
      );
      // Rattache au contrat pour ne pas se confondre avec les quittances
      // reglees separement sur un lot mixte bijoux + or investissement.
      const dejaPaye = reglements
        .filter((r) => r.type === "rachat" && r.document_id === (contrat?.id ?? null))
        .reduce((sum, r) => sum + r.montant, 0);
      const restant = Math.round(Math.max(0, attendu - dejaPaye) * 100) / 100;

      payments.push({
        type: "rachat",
        sens: "sortant",
        label: contrat
          ? `Contrat ${contrat.numero} | Paiement client anticipé`
          : "Rachat | Paiement client anticipé",
        description: `Montant net des ${refsEnRetractation.length} article${refsEnRetractation.length > 1 ? "s" : ""} en cours de rétractation`,
        montant_attendu: attendu,
        montant_deja_paye: dejaPaye,
        montant_restant: restant,
        is_fully_paid: restant < 0.01,
        pre_fill: {
          type: "rachat",
          sens: "sortant",
          montant: restant,
          client_id: clientId,
          document_id: contrat?.id,
        },
      });
    }
  }

  // --- RACHAT : on paie le client ---
  // Un lot retracte, refuse ou annule est marque « finalise » comme un lot mene
  // a terme : seul `outcome` les distingue. Sans ce test, la fiche reclamait un
  // versement sur une operation close.
  if (lot.type === "rachat" && lot.status === "finalise" && !estSansSuite(lot)) {
    const attendu = lot.montant_net;
    const dejaPaye = sumReglements(reglements, "rachat", "sortant");
    const restant = Math.round(Math.max(0, attendu - dejaPaye) * 100) / 100;
    payments.push({
      type: "rachat",
      sens: "sortant",
      label: "Rachat | Paiement client à effectuer",
      description: "Montant net du rachat à verser au client",
      montant_attendu: attendu,
      montant_deja_paye: dejaPaye,
      montant_restant: restant,
      is_fully_paid: restant < 0.01,
      pre_fill: {
        type: "rachat",
        sens: "sortant",
        montant: restant,
        client_id: clientId,
        document_id: findDocumentId(documents, lot.id, "rachat"),
      },
    });
  }

  // --- RACHAT sans suite : le client nous rembourse ---
  // Cas courant en boutique : le client est reparti avec son argent le jour
  // meme, puis s'est retracte. La somme versee doit revenir. Elle n'etait
  // saisissable nulle part — seul un reglement negatif automatique existait,
  // invisible dans l'interface.
  if (lot.type === "rachat" && estSansSuite(lot)) {
    const verse = sumReglements(reglements, "rachat", "sortant");
    const rembourse = sumReglements(reglements, "rachat", "entrant");
    const restant = Math.round(Math.max(0, verse - rembourse) * 100) / 100;

    if (verse > 0.01) {
      const recu = findRecuRetractation(documents, lot.id);
      payments.push({
        type: "rachat",
        sens: "entrant",
        label: recu
          ? `Reçu ${recu.numero} | Remboursement à encaisser`
          : "Rachat rétracté | Remboursement à encaisser",
        description:
          "Somme versée au client avant sa rétractation, qu'il doit restituer",
        montant_attendu: verse,
        montant_deja_paye: rembourse,
        montant_restant: restant,
        is_fully_paid: restant < 0.01,
        pre_fill: {
          type: "rachat",
          sens: "entrant",
          montant: restant,
          client_id: clientId,
          document_id: recu?.id,
        },
      });
    }
  }

  // --- VENTE ---
  if (lot.type === "vente" && lot.status === "en_cours") {
    const bijouxLignes = lignes.filter((l) => !l.or_investissement_id);
    const orInvestLignes = lignes.filter((l) => l.or_investissement_id);

    // L'or d'investissement n'attend un acompte que si le comptoir l'a demande
    // sur cette vente-la. Sinon il se regle d'un seul versement, avec le reste
    // du panier : une facture, un encaissement.
    const avecAcompte = orInvestLignes.length > 0 && lot.avec_acompte !== false;

    // Le prix d'un bijou est celui de l'etiquette, TVA comprise — qu'elle porte
    // sur la marge ou sur le prix entier. L'ajouter au prix reviendrait a
    // reclamer au client un cinquieme de plus que ce qu'il a vu en vitrine.
    // Seule la TFOP des lignes anciennes s'ajoutait vraiment au prix.
    const totalBijoux = bijouxLignes.reduce(
      (sum, l) => sum + l.prix_total + (l.type_taxe === "tfop" ? l.montant_taxe : 0),
      0
    );
    const totalOrInvest = orInvestLignes.reduce(
      (sum, l) => sum + l.prix_total + l.montant_taxe,
      0
    );

    // Paiement direct : les bijoux, et l'or d'investissement quand il n'a pas
    // ete reserve contre un acompte.
    const lignesDirectes = avecAcompte ? bijouxLignes : lignes;
    if (lignesDirectes.length > 0) {
      const totalDirect = Math.round(
        (avecAcompte ? totalBijoux : totalBijoux + totalOrInvest) * 100
      ) / 100;
      const dejaPaye = sumReglements(reglements, "vente");
      const restant = Math.round(Math.max(0, totalDirect - dejaPaye) * 100) / 100;
      payments.push({
        type: "vente",
        sens: "entrant",
        label: `Facture ${findDocument(documents, lot.id, "vente")?.numero ?? ""} | Encaissement client`.replace("  ", " "),
        description:
          orInvestLignes.length > 0 && !avecAcompte
            ? "Montant TTC de la vente"
            : "Montant TTC de la vente bijoux",
        montant_attendu: totalDirect,
        montant_deja_paye: dejaPaye,
        montant_restant: restant,
        is_fully_paid: restant < 0.01,
        pre_fill: {
          type: "vente",
          sens: "entrant",
          montant: restant,
          client_id: clientId,
          document_id: findDocumentId(documents, lot.id, "vente"),
        },
      });
    }

    // Or investissement : acompte + solde
    if (avecAcompte) {
      const acompteRate = acompte_pct / 100;
      const montantAcompte = Math.round(totalOrInvest * acompteRate * 100) / 100;
      const montantSolde = totalOrInvest - montantAcompte;

      // Acompte
      const acomptePaye = sumReglements(reglements, "acompte");
      const acompteRestant = Math.round(Math.max(0, montantAcompte - acomptePaye) * 100) / 100;
      payments.push({
        type: "acompte",
        sens: "entrant",
        label: `Facture ${findDocument(documents, lot.id, "acompte")?.numero ?? ""} | Acompte client à encaisser (${acompte_pct}%)`.replace("  ", " "),
        description: `Acompte de ${acompte_pct}% sur ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalOrInvest)}`,
        montant_attendu: montantAcompte,
        montant_deja_paye: acomptePaye,
        montant_restant: acompteRestant,
        is_fully_paid: acompteRestant < 0.01,
        pre_fill: {
          type: "acompte",
          sens: "entrant",
          montant: acompteRestant,
          client_id: clientId,
          document_id: findDocumentId(documents, lot.id, "acompte"),
        },
      });

      // Solde (visible seulement si acompte payé)
      if (acompteRestant < 0.01) {
        const soldePaye = sumReglements(reglements, "solde");
        const soldeRestant = Math.round(Math.max(0, montantSolde - soldePaye) * 100) / 100;
        payments.push({
          type: "solde",
          sens: "entrant",
          label: `Facture ${findDocument(documents, lot.id, "solde")?.numero ?? ""} | Solde client à encaisser (${100 - acompte_pct}%)`.replace("  ", " "),
          description: `Solde restant après acompte de ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montantAcompte)}`,
          montant_attendu: montantSolde,
          montant_deja_paye: soldePaye,
          montant_restant: soldeRestant,
          is_fully_paid: soldeRestant < 0.01,
          pre_fill: {
            type: "solde",
            sens: "entrant",
            montant: soldeRestant,
            client_id: clientId,
            document_id: findDocumentId(documents, lot.id, "solde"),
          },
        });
      }
    }
  }

  // --- DEPOT-VENTE : paiement net déposant par quittance non réglée ---
  if (lot.type === "depot_vente" && (lot.status === "en_cours" || lot.status === "finalise")) {
    const unregedQdv = documents.filter(
      (d) => d.lot_id === lot.id && d.type === "quittance_depot_vente" && d.status !== "regle"
    );
    for (const qdvDoc of unregedQdv) {
      const docWithRefs = qdvDoc as { document_references?: { lot_reference_id: string }[] };
      const linkedRefIds = new Set(
        (docWithRefs.document_references ?? []).map((dr) => dr.lot_reference_id)
      );
      const linkedRefs = lotReferences.filter((r) => linkedRefIds.has(r.id));
      if (linkedRefs.length === 0) continue;

      // Net verse au deposant : son prix, moins la taxe forfaitaire que la
      // boutique retient et declare pour son compte — comme sur un rachat.
      const totalNetDeposant = linkedRefs.reduce(
        (sum, r) => sum + (r.prix_achat - r.montant_taxe) * r.quantite,
        0
      );
      const dejaPaye = reglements
        .filter((r) => r.type === "depot_vente" && r.document_id === qdvDoc.id)
        .reduce((sum, r) => sum + r.montant, 0);
      const restant = Math.round(Math.max(0, totalNetDeposant - dejaPaye) * 100) / 100;
      payments.push({
        type: "depot_vente",
        sens: "sortant",
        label: `Quittance ${qdvDoc.numero} | Net déposant à verser`,
        description: `Montant dû au déposant pour ${linkedRefs.length} article${linkedRefs.length > 1 ? "s" : ""} vendu${linkedRefs.length > 1 ? "s" : ""}`,
        montant_attendu: totalNetDeposant,
        montant_deja_paye: dejaPaye,
        montant_restant: restant,
        is_fully_paid: restant < 0.01,
        pre_fill: {
          type: "depot_vente",
          sens: "sortant",
          montant: restant,
          client_id: clientId,
          document_id: qdvDoc.id,
        },
      });
    }
  }

  // --- FONDERIE : paiement par bon de commande ---
  // Ce qu'on doit vient du devis que la fonderie renvoie apres l'envoi de la
  // commande, jamais du prix de vente au catalogue. Tant qu'il n'est pas saisi,
  // il n'y a rien a payer : reclamer un montant serait reclamer le mauvais.
  for (const bdc of bonsCommande) {
    if (bdc.statut === "annule" || bdc.statut === "paye") continue;

    const dejaPaye = reglements
      .filter((r) => r.type === "fonderie" && r.bon_commande_id === bdc.id)
      .reduce((sum, r) => sum + r.montant, 0);
    const restant = Math.round(Math.max(0, bdc.montant_fonderie - dejaPaye) * 100) / 100;

    if (restant >= 0.01) {
      payments.push({
        type: "fonderie",
        sens: "sortant",
        label: `Bon de commande ${bdc.numero} | Paiement fonderie à effectuer`,
        description: `Bon de commande ${bdc.numero}${bdc.fonderie?.nom ? ` (${bdc.fonderie.nom})` : ""}`,
        montant_attendu: bdc.montant_fonderie,
        montant_deja_paye: dejaPaye,
        montant_restant: restant,
        is_fully_paid: false,
        pre_fill: {
          type: "fonderie",
          sens: "sortant",
          montant: restant,
          fonderie_id: bdc.fonderie_id,
          bon_commande_id: bdc.id,
        },
      });
    }
  }

  return payments;
}

/** Check if all required payments for a lot are fully paid */
export function areAllPaymentsMade(paymentsDue: PaymentDue[]): boolean {
  return paymentsDue.length === 0 || paymentsDue.every((p) => p.is_fully_paid);
}
