"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAndStoreDocument } from "@/lib/pdf/generate-and-store";
import { tauxLigne, libelleTotalTaxe } from "@/lib/pdf/taxes-labels";
import { ligneSousMarge, totauxFactureVente } from "@/lib/pdf/facture-vente-regime";
import { calculerTFOP } from "@/lib/calculations/taxes";
import { getSettingServer } from "@/lib/settings-server";
import { formatDate, formatDateTime, formatTime, libelleModeReglement } from "@/lib/format";
import type {
  ClientInfo,
  DossierInfo,
  ReferenceLigne,
  TotauxInfo,
  DepotVenteReferenceLigne,
  ConfieReferenceLigne,
  FactureVenteLigne,
  QuittanceDepotVenteLigne,
} from "@/lib/pdf";

const RETRACTATION_DELAY_MS = 48 * 60 * 60 * 1000;

/**
 * Repli du delai de reglement du solde, quand la boutique n'a rien regle.
 *
 * Il valait auparavant le delai de retractation, par emprunt de constante : les
 * deux durent quarante-huit heures, mais l'une est un droit du client et
 * l'autre une echeance de paiement. Les confondre revenait a ignorer le reglage
 * `solde_delai_heures` de l'ecran des parametres — et le rappel de solde, qui
 * tombe a la moitie de ce delai, n'aurait eu aucune duree fiable a diviser.
 */
const SOLDE_DELAI_DEFAUT_H = 48;

import { envoyerRecapCloture } from "@/lib/email/recap-cloture";

export interface FinaliseResult {
  success: boolean;
  error?: string;
}

interface InternalResult {
  success: boolean;
  error?: string;
}

type SB = Awaited<ReturnType<typeof createClient>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ref = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VenteLigne = any;

/* ──────────────────────── AUTO-PROCESS EXPIRED RETRACTATION ──── */

/**
 * Server-side: auto-process any expired retractation refs for a dossier.
 * Called from the dossier detail page server component BEFORE rendering.
 */
export async function autoProcessExpiredRetractation(dossierId: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();

  // Find lots in en_cours for this dossier
  const { data: lots } = await supabase
    .from("lots")
    .select("id, type, status")
    .eq("dossier_id", dossierId)
    .in("type", ["rachat", "depot_vente"])
    .eq("status", "en_cours");

  if (!lots || lots.length === 0) return;

  for (const lot of lots) {
    // Atomically claim expired refs by updating status (prevents double-processing)
    const { data: expiredRefs } = await supabase
      .from("lot_references")
      .update({ status: "en_attente_paiement" })
      .eq("lot_id", lot.id)
      .eq("status", "en_retractation")
      .lte("date_fin_delai", now.toISOString())
      .select("*");

    if (!expiredRefs || expiredRefs.length === 0) {
      // No expired refs to process, but still check if lot should be finalized
      // (e.g. all refs were finalized by payments but lot status wasn't updated)
      const { data: allRefs } = await supabase
        .from("lot_references")
        .select("status")
        .eq("lot_id", lot.id);

      const terminalStatuses = ["finalise", "devis_refuse", "retracte", "rendu_client", "vendu"];
      const allTerminal = (allRefs ?? []).every(
        (r: { status: string }) => terminalStatuses.includes(r.status)
      );

      if (allTerminal) {
        await supabase.from("lots").update({
          status: "finalise", outcome: "complete", date_finalisation: now.toISOString(),
        }).eq("id", lot.id);
      }
      continue;
    }

    const isDepotVente = lot.type === "depot_vente";

    // Sign contracts
    await supabase
      .from("documents")
      .update({ status: "signe" })
      .eq("lot_id", lot.id)
      .in("type", ["contrat_rachat", "contrat_depot_vente", "confie_achat"])
      .eq("status", "en_attente");

    // Generate one quittance per signed contract (each contract = its own refs)
    if (!isDepotVente && expiredRefs.length > 0) {
      const { data: dossier } = await supabase
        .from("dossiers")
        .select("*, client:clients(*)")
        .eq("id", dossierId)
        .single();

      if (dossier) {
        const { data: lotData } = await supabase.from("lots").select("numero").eq("id", lot.id).single();
        const clientInfo = buildClientInfo(dossier);
        const dossierInfo = buildDossierInfo(dossier, { numero: lotData?.numero ?? "" }, now);

        // Get signed contracts and their linked refs
        const { data: signedContrats } = await supabase
          .from("documents")
          .select("id, document_references(lot_reference_id)")
          .eq("lot_id", lot.id)
          .eq("type", "contrat_rachat")
          .eq("status", "signe");

        const expiredRefIds = new Set(expiredRefs.map((r: Ref) => r.id));

        for (const contrat of signedContrats ?? []) {
          const contratRefIds = (contrat.document_references ?? [])
            .map((dr: { lot_reference_id: string }) => dr.lot_reference_id)
            .filter((id: string) => expiredRefIds.has(id));

          if (contratRefIds.length === 0) continue;

          // Check if a quittance already exists for these refs (idempotency)
          const { data: existingDocRefs } = await supabase
            .from("document_references")
            .select("document_id")
            .in("lot_reference_id", contratRefIds);
          const linkedDocIds = [...new Set((existingDocRefs ?? []).map((dr: { document_id: string }) => dr.document_id))];
          if (linkedDocIds.length > 0) {
            const { data: linkedDocs } = await supabase
              .from("documents")
              .select("type")
              .in("id", linkedDocIds)
              .eq("type", "quittance_rachat")
              .limit(1);
            if (linkedDocs && linkedDocs.length > 0) continue;
          }

          const contratRefs = expiredRefs.filter((r: Ref) => contratRefIds.includes(r.id));
          const refLignes: ReferenceLigne[] = contratRefs.map((r: Ref) => ({
            designation: r.designation,
            reference: r.numero ?? null,
            metal: r.metal ?? "—",
            titrage: r.qualite ?? "—",
            poids: r.poids_net ?? r.poids ?? 0,
            quantite: r.quantite,
            taxe: tauxLigne(r.regime_fiscal, r.montant_taxe),
            prixUnitaire: r.prix_achat,
            prixTotal: r.prix_achat * r.quantite,
          }));

          const qResult = await genDoc({
            type: "quittance_rachat",
            lotId: lot.id,
            dossierId,
            clientId: dossier.client.id,
            client: clientInfo,
            dossier: dossierInfo,
            references: refLignes,
            totaux: buildTotaux(contratRefs),
            lotReferenceIds: contratRefIds,
          }, "quittance_rachat");
          if (qResult.error) {
            console.error(`[AUTO-RETRACT] Quittance generation failed for contrat ${contrat.id}:`, qResult.error);
          }
        }
      }
    }

    // Check if lot can be finalized (only if all refs are terminal)
    const { data: allRefs } = await supabase
      .from("lot_references")
      .select("status")
      .eq("lot_id", lot.id);

    const terminalStatuses = ["finalise", "devis_refuse", "retracte", "rendu_client", "vendu"];
    const allTerminal = (allRefs ?? []).every(
      (r: { status: string }) => terminalStatuses.includes(r.status)
    );

    if (allTerminal) {
      await supabase.from("lots").update({
        status: "finalise", outcome: "complete", date_finalisation: now.toISOString(),
      }).eq("id", lot.id);
    }
  }

  // Check if dossier can be finalized
  const { data: allLots } = await supabase
    .from("lots")
    .select("status")
    .eq("dossier_id", dossierId);

  if ((allLots ?? []).every((l: { status: string }) => l.status === "finalise")) {
    await supabase.from("dossiers").update({ status: "finalise" }).eq("id", dossierId);
  }
}

/* ──────────────────────── PUBLIC ACTIONS ──────────────────────── */

export async function finaliserDossierAction(dossierId: string): Promise<FinaliseResult> {
  try {
    const supabase = await createClient();

    const { data: dossier, error: dossierErr } = await supabase
      .from("dossiers")
      .select("*, client:clients(*)")
      .eq("id", dossierId)
      .single();

    if (dossierErr || !dossier) {
      return { success: false, error: `Dossier introuvable: ${dossierErr?.message ?? ""}` };
    }

    // Vérifier la validité du client avant de finaliser
    if (!dossier.client?.is_valid) {
      return { success: false, error: "Le client n'est plus valide. Veuillez vérifier sa pièce d'identité avant de valider le dossier." };
    }

    const { data: brouillonLots } = await supabase
      .from("lots")
      .select("*")
      .eq("dossier_id", dossierId)
      .eq("status", "brouillon");

    if (!brouillonLots || brouillonLots.length === 0) {
      return { success: false, error: "Aucun lot brouillon à finaliser" };
    }

    // Photo obligatoire sur ce qui entre en boutique. La finalisation est le
    // moment ou l'on s'engage : contrat emis, delai de retractation ouvert,
    // marchandise prise en charge. Passe ce point, plus personne ne
    // photographiera le lot tel qu'il a ete remis.
    //
    // Le controle est ici, cote serveur, et pas seulement sur l'ecran de
    // confirmation : c'est la seule barriere que l'appelant ne peut pas
    // contourner.
    const lotsAPhotographier = brouillonLots.filter(
      (l: { type: string }) => l.type === "rachat" || l.type === "depot_vente"
    );

    if (lotsAPhotographier.length > 0) {
      const { data: photos } = await supabase
        .from("lot_photos")
        .select("lot_id")
        .in("lot_id", lotsAPhotographier.map((l: { id: string }) => l.id))
        .is("reference_id", null);

      const photographies = new Set((photos ?? []).map((p: { lot_id: string }) => p.lot_id));
      const manquants = lotsAPhotographier.filter(
        (l: { id: string }) => !photographies.has(l.id)
      );

      if (manquants.length > 0) {
        const numeros = manquants.map((l: { numero: string }) => l.numero).join(", ");
        return {
          success: false,
          error:
            manquants.length > 1
              ? `Photo manquante sur les lots ${numeros}. Photographiez la marchandise avant de finaliser.`
              : `Photo manquante sur le lot ${numeros}. Photographiez la marchandise avant de finaliser.`,
        };
      }
    }

    const now = new Date();
    const delai48h = new Date(now.getTime() + RETRACTATION_DELAY_MS);

    for (const lot of brouillonLots) {
      let result: InternalResult;

      if (lot.type === "rachat") {
        result = await processRachatLot(supabase, lot, dossier, now, delai48h);
      } else if (lot.type === "depot_vente") {
        result = await processDepotVenteLot(supabase, lot, dossier, now);
      } else if (lot.type === "vente") {
        result = await processVenteLot(supabase, lot, dossier, now);
      } else {
        continue;
      }

      if (!result.success) return result;
    }

    // Check if ALL lots are now finalized/terminated
    const { data: updatedLots } = await supabase
      .from("lots")
      .select("status")
      .eq("dossier_id", dossierId);

    const allDone = (updatedLots ?? []).every(
      (l: { status: string }) => l.status === "finalise"
    );

    const newStatus = allDone ? "finalise" : "en_cours";
    const { error: statusErr } = await supabase
      .from("dossiers")
      .update({ status: newStatus })
      .eq("id", dossierId);

    if (statusErr) {
      return { success: false, error: `Erreur mise à jour statut dossier: ${statusErr.message}` };
    }

    // Le client n'est ecrit qu'une fois, a la cloture, avec le recapitulatif de
    // tout le dossier et ses pieces. Chaque etape envoyait auparavant son propre
    // courriel — devis, contrat, facture d'acompte, facture de solde — et un
    // dossier ordinaire en produisait quatre ou cinq le meme apres-midi.
    if (allDone) {
      await envoyerRecapCloture(dossierId);
    }

    return { success: true };
  } catch (err) {
    console.error("[FINALIZE-ACTION] Unexpected error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue" };
  }
}

/* ──────────────────────── HELPERS ──────────────────────── */

function buildClientInfo(dossier: { client: { civility: string; first_name: string; last_name: string; address: string | null; postal_code: string | null; city: string | null; phone?: string | null; email?: string | null } }): ClientInfo {
  return {
    civilite: dossier.client.civility === "M" ? "M." : "Mme",
    nom: dossier.client.last_name,
    prenom: dossier.client.first_name,
    adresse: dossier.client.address ?? undefined,
    codePostal: dossier.client.postal_code ?? undefined,
    ville: dossier.client.city ?? undefined,
    // Rappelees en tete de l'annexe du contrat de depot-vente.
    telephone: dossier.client.phone ?? undefined,
    email: dossier.client.email ?? undefined,
  };
}

function buildDossierInfo(dossier: { numero: string }, lot: { numero: string }, now: Date): DossierInfo {
  return {
    numeroDossier: dossier.numero,
    numeroLot: lot.numero,
    date: formatDate(now.toISOString()),
    heure: formatTime(now),
  };
}

function buildRefLignes(refList: Ref[]): ReferenceLigne[] {
  return refList.map((r: Ref) => ({
    designation: r.designation,
    reference: r.numero ?? null,
    metal: r.metal ?? "—",
    titrage: r.qualite ?? "—",
    poids: r.poids_net ?? r.poids ?? 0,
    quantite: r.quantite,
    taxe: tauxLigne(r.regime_fiscal, r.montant_taxe),
    prixUnitaire: r.prix_achat,
    prixTotal: r.prix_achat * r.quantite,
  }));
}

function buildTotaux(refList: Ref[]): TotauxInfo {
  const brut = refList.reduce((s: number, r: Ref) => s + r.prix_achat * r.quantite, 0);
  const taxe = refList.reduce((s: number, r: Ref) => s + r.montant_taxe * r.quantite, 0);
  return { totalBrut: brut, taxe, netAPayer: brut - taxe, taxeLabel: libelleTotalTaxe(refList) };
}

async function genDoc(params: Parameters<typeof generateAndStoreDocument>[0], label: string): Promise<{ path: string | null; numero?: string; error?: string }> {
  const result = await generateAndStoreDocument(params, true);
  if (result.error) {
    return { path: null, error: `${label}: ${result.error}` };
  }
  return { path: result.path, numero: result.numero };
}

/**
 * Écrit l'enregistrement comptable d'une facture.
 *
 * Le PDF est stocké dans `documents`, mais le chiffre d'affaires du tableau de
 * bord, le montant en attente et la TVA de la page Impôts se lisent dans
 * `factures`. Sans cette écriture, ces trois indicateurs restent à zéro quel
 * que soit le volume de ventes réalisé.
 *
 * Le numéro est repris du document plutôt que laissé au trigger
 * `generate_facture_numero` : son format `FAC-YYYY-NNNN` entrerait en collision
 * avec le préfixe des factures d'acompte.
 *
 * Un échec ici n'interrompt pas la finalisation — le PDF est déjà émis et parti
 * chez le client — mais il est tracé pour pouvoir être rattrapé.
 */
async function enregistrerFacture(
  supabase: SB,
  params: {
    numero: string | undefined;
    lotId: string;
    clientId: string;
    montantHT: number;
    montantTaxe: number;
    montantTTC: number;
  },
): Promise<void> {
  if (!params.numero) return;

  const { error } = await supabase.from("factures").insert({
    numero: params.numero,
    lot_id: params.lotId,
    client_id: params.clientId,
    montant_ht: params.montantHT,
    montant_taxe: params.montantTaxe,
    montant_ttc: params.montantTTC,
  });

  if (error) {
    console.error("[FACTURE] écriture comptable échouée:", params.numero, error.message);
  }
}

/* ──────────────────────── RACHAT ──────────────────────── */

async function processRachatLot(supabase: SB, lot: Ref, dossier: Ref, now: Date, delai48h: Date): Promise<InternalResult> {
  const { data: refs } = await supabase.from("lot_references").select("*").eq("lot_id", lot.id);

  let allImmediate = true;

  for (const ref of refs ?? []) {
    if (ref.type_rachat === "devis") {
      const { error } = await supabase
        .from("lot_references")
        .update({ status: "devis_envoye", date_envoi: now.toISOString(), date_fin_delai: delai48h.toISOString() })
        .eq("id", ref.id);
      if (error) return { success: false, error: `Erreur mise à jour réf devis: ${error.message}` };
      allImmediate = false;
    } else if (ref.categorie === "bijoux" && ref.type_rachat === "direct") {
      const { error } = await supabase
        .from("lot_references")
        .update({ status: "en_retractation", date_envoi: now.toISOString(), date_fin_delai: delai48h.toISOString() })
        .eq("id", ref.id);
      if (error) return { success: false, error: `Erreur mise à jour réf rétractation: ${error.message}` };
      allImmediate = false;
    } else if (ref.categorie === "or_investissement" && ref.type_rachat === "direct") {
      // Stock NOT incremented here — only after payment of the quittance
      const { error } = await supabase.from("lot_references").update({ status: "en_attente_paiement" }).eq("id", ref.id);
      if (error) return { success: false, error: `Erreur mise en attente paiement réf: ${error.message}` };
      allImmediate = false;
    }
  }

  // Generate documents
  const allRefs = refs ?? [];
  const clientInfo = buildClientInfo(dossier);

  const { data: idDoc } = await supabase
    .from("client_identity_documents")
    .select("document_type, document_number")
    .eq("client_id", dossier.client.id)
    .eq("is_primary", true)
    .single();
  if (idDoc) {
    clientInfo.documentType = idDoc.document_type;
    clientInfo.documentNumber = idDoc.document_number;
  }

  const dossierInfo = buildDossierInfo(dossier, lot, now);
  const bijouxDirect = allRefs.filter((r: Ref) => r.categorie === "bijoux" && r.type_rachat === "direct");
  const orInvestDirect = allRefs.filter((r: Ref) => r.categorie === "or_investissement" && r.type_rachat === "direct");
  const devisRefs = allRefs.filter((r: Ref) => r.type_rachat === "devis");
  const docErrors: string[] = [];

  if (bijouxDirect.length > 0) {
    const res = await genDoc({
      type: "contrat_rachat", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: buildRefLignes(bijouxDirect), totaux: buildTotaux(bijouxDirect),
      lotReferenceIds: bijouxDirect.map((r: Ref) => r.id),
    }, "contrat_rachat");
    if (res.error) docErrors.push(res.error);
  }

  if (orInvestDirect.length > 0) {
    const res = await genDoc({
      type: "quittance_rachat", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: buildRefLignes(orInvestDirect), totaux: buildTotaux(orInvestDirect),
      lotReferenceIds: orInvestDirect.map((r: Ref) => r.id),
    }, "quittance_rachat");
    if (res.error) docErrors.push(res.error);
  }

  if (devisRefs.length > 0) {
    const res = await genDoc({
      type: "devis_rachat", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: buildRefLignes(devisRefs), totaux: buildTotaux(devisRefs),
      lotReferenceIds: devisRefs.map((r: Ref) => r.id),
    }, "devis_rachat");
    if (res.error) docErrors.push(res.error);
  }

  if (docErrors.length > 0) {
    return { success: false, error: `Echec génération: ${docErrors.join(", ")}` };
  }

  // Update lot status
  const newStatus = allImmediate ? "finalise" : "en_cours";
  const updateData = allImmediate
    ? { status: newStatus, outcome: "complete", date_finalisation: now.toISOString() }
    : { status: newStatus };
  const { error: lotErr } = await supabase.from("lots").update(updateData).eq("id", lot.id);
  if (lotErr) return { success: false, error: `Erreur passage lot rachat: ${lotErr.message}` };

  return { success: true };
}

/* ──────────────────────── DEPOT-VENTE ──────────────────────── */

async function processDepotVenteLot(supabase: SB, lot: Ref, dossier: Ref, now: Date): Promise<InternalResult> {
  const { data: refs } = await supabase.from("lot_references").select("*").eq("lot_id", lot.id);

  // Les références restent en expertise jusqu'à la signature du contrat
  // C'est l'action doc.signer_contrat_dpv qui créera les entrées stock

  // Generate documents
  const allDvRefs = refs ?? [];
  const clientInfo = buildClientInfo(dossier);

  const { data: idDoc } = await supabase
    .from("client_identity_documents")
    .select("document_type, document_number")
    .eq("client_id", dossier.client.id)
    .eq("is_primary", true)
    .single();
  if (idDoc) {
    clientInfo.documentType = idDoc.document_type;
    clientInfo.documentNumber = idDoc.document_number;
  }

  // Le contrat annonce le taux reellement applique, et non un 40 % ecrit en dur.
  const reglesDv = await getSettingServer("business_rules");
  const commissionPct = reglesDv?.commission_dv_pct ?? 40;

  const dossierInfo = buildDossierInfo(dossier, lot, now);
  const dvRefs: DepotVenteReferenceLigne[] = allDvRefs.map((r: Ref) => ({
    designation: r.designation,
    reference: r.numero ?? null,
    description: [r.metal, r.qualite].filter(Boolean).join(" ") || "—",
    // Le poids ne remontait pas jusqu'au template : le contrat engageait la
    // boutique sur de la marchandise dont il ne disait pas la masse.
    poids: r.poids_net ?? r.poids ?? 0,
    quantite: r.quantite ?? 1,
    metal: r.metal ?? "",
    titrage: r.qualite ?? "",
    prixNetDeposant: r.prix_achat,
    prixAffichePublic: r.prix_revente_estime ?? 0,
  }));

  const docErrors: string[] = [];

  const contratRes = await genDoc({
    type: "contrat_depot_vente", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
    client: clientInfo, dossier: dossierInfo, depotVenteReferences: dvRefs, numeroLot: lot.numero,
    commissionPct,
    references: [], totaux: { totalBrut: 0, taxe: 0, netAPayer: 0 },
    lotReferenceIds: allDvRefs.map((r: Ref) => r.id),
  }, "contrat_depot_vente");
  if (contratRes.error) docErrors.push(contratRes.error);

  for (const ref of allDvRefs) {
    const confieRef: ConfieReferenceLigne = {
      titre: ref.qualite ?? "—",
      designation: `${ref.designation} (${ref.metal ?? "—"})`,
      reference: ref.numero ?? null,
      quantite: ref.quantite,
      poids: ref.poids_net ?? ref.poids ?? 0,
      prixAchat: ref.prix_achat,
      prixVente: ref.prix_revente_estime ?? 0,
    };
    const res = await genDoc({
      type: "confie_achat", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, confieReference: confieRef,
      references: [], totaux: { totalBrut: ref.prix_revente_estime ?? 0, taxe: 0, netAPayer: ref.prix_revente_estime ?? 0 },
      lotReferenceIds: [ref.id],
    }, "confie_achat");
    if (res.error) docErrors.push(res.error);
  }

  if (docErrors.length > 0) {
    return { success: false, error: `Echec génération: ${docErrors.join(", ")}` };
  }

  // Le lot dépôt-vente reste en_cours tant que toutes les refs ne sont pas terminées (vendues ou rendues)
  const { error: lotErr } = await supabase.from("lots").update({ status: "en_cours" }).eq("id", lot.id);
  if (lotErr) return { success: false, error: `Erreur passage lot DV en cours: ${lotErr.message}` };

  return { success: true };
}

/* ──────────────────────── VENTE ──────────────────────── */

async function processVenteLot(supabase: SB, lot: Ref, dossier: Ref, now: Date): Promise<InternalResult> {
  const { data: lignes, error: lignesErr } = await supabase
    .from("vente_lignes")
    .select("*")
    .eq("lot_id", lot.id)
    .order("created_at", { ascending: true });

  if (lignesErr) return { success: false, error: `Erreur récup lignes vente: ${lignesErr.message}` };
  if (!lignes || lignes.length === 0) return { success: false, error: `Aucune ligne de vente pour lot ${lot.numero}` };

  const bijouxLignes = lignes.filter((l: VenteLigne) => !l.or_investissement_id);
  const orInvestLignes = lignes.filter((l: VenteLigne) => !!l.or_investissement_id);

  const clientInfo = buildClientInfo(dossier);
  const { data: idDoc } = await supabase
    .from("client_identity_documents")
    .select("document_type, document_number")
    .eq("client_id", dossier.client.id)
    .eq("is_primary", true)
    .single();
  if (idDoc) {
    clientInfo.documentType = idDoc.document_type;
    clientInfo.documentNumber = idDoc.document_number;
  }

  const dossierInfo = buildDossierInfo(dossier, lot, now);
  const docErrors: string[] = [];

  function buildFactureLignes(lines: VenteLigne[]): FactureVenteLigne[] {
    return lines.map((l: VenteLigne) => ({
      titre: [l.metal, l.qualite].filter(Boolean).join(" ") || l.designation || "Article",
      designation: l.designation ?? "",
      poids: l.poids_net ?? l.poids ?? 0,
      quantite: l.quantite ?? 1,
      prixUnitaireHT: l.prix_unitaire ?? 0,
      totalHT: l.prix_total ?? 0,
      sousMarge: ligneSousMarge(l),
    }));
  }

  // Phase 1: Generate quittances DPV for depot-vente items (BEFORE factures)
  const dvItemsByLot = new Map<string, Array<{ stockId: string; prixVente: number; designation: string }>>();
  for (const ligne of bijouxLignes) {
    if (!ligne.bijoux_stock_id) continue;
    const { data: stockItem } = await supabase
      .from("bijoux_stock")
      .select("depot_vente_lot_id")
      .eq("id", ligne.bijoux_stock_id)
      .single();
    if (stockItem?.depot_vente_lot_id) {
      const existing = dvItemsByLot.get(stockItem.depot_vente_lot_id) ?? [];
      existing.push({ stockId: ligne.bijoux_stock_id, prixVente: ligne.prix_total, designation: ligne.designation });
      dvItemsByLot.set(stockItem.depot_vente_lot_id, existing);
    }
  }

  for (const [dvLotId, items] of dvItemsByLot.entries()) {
    // Use the server action to generate the quittance
    const { data: dvLot } = await supabase
      .from("lots")
      .select("id, numero, dossier_id, dossier:dossiers(id, numero, client:clients(id, civility, first_name, last_name, address, postal_code, city))")
      .eq("id", dvLotId)
      .single();

    if (!dvLot?.dossier) continue;

    const dvDossier = dvLot.dossier as Ref;
    const deposant = dvDossier.client;

    const { data: dvIdDoc } = await supabase
      .from("client_identity_documents")
      .select("document_type, document_number")
      .eq("client_id", deposant.id)
      .eq("is_primary", true)
      .single();

    const stockIds = items.map((i) => i.stockId);
    const { data: lotRefs } = await supabase
      .from("lot_references")
      .select("id, destination_stock_id, prix_achat, designation")
      .in("destination_stock_id", stockIds);

    // Idempotence: check if a quittance DPV already exists for these refs
    const refIds = (lotRefs ?? []).map((r: Ref) => r.id);
    if (refIds.length > 0) {
      const { data: existingDocRefs } = await supabase
        .from("document_references")
        .select("document_id")
        .in("lot_reference_id", refIds);
      const linkedDocIds = [...new Set((existingDocRefs ?? []).map((dr: { document_id: string }) => dr.document_id))];
      if (linkedDocIds.length > 0) {
        const { data: existingQdv } = await supabase
          .from("documents")
          .select("type")
          .in("id", linkedDocIds)
          .eq("type", "quittance_depot_vente")
          .limit(1);
        if (existingQdv && existingQdv.length > 0) continue;
      }
    }

    const refByStockId = new Map((lotRefs ?? []).map((r: Ref) => [r.destination_stock_id, r]));

    const qdvLignes: QuittanceDepotVenteLigne[] = [];
    let totalVentes = 0;
    let totalCommission = 0;
    let totalNetDeposant = 0;

    // La quittance de depot-vente est l'acte par lequel la boutique achete le
    // bijou au deposant : elle porte la meme fiscalite qu'une quittance de
    // rachat. La taxe forfaitaire s'apprecie par objet, sur le net verse au
    // deposant, et se retient sur ce qu'on lui doit.
    let totalTaxe = 0;
    const taxesParRef: { refId: string; taxe: number }[] = [];

    for (const item of items) {
      const ref = refByStockId.get(item.stockId);
      const prixVente = item.prixVente;
      const netDeposant = ref?.prix_achat ?? prixVente * 0.6;
      const commission = prixVente - netDeposant;
      const taxe = calculerTFOP(netDeposant);
      if (ref?.id) taxesParRef.push({ refId: ref.id, taxe });
      qdvLignes.push({ designation: ref?.designation ?? item.designation, description: item.designation, prixVentePublic: prixVente, netDeposant, commission });
      totalVentes += prixVente;
      totalCommission += commission;
      totalTaxe += taxe;
      totalNetDeposant += netDeposant - taxe;
    }

    // La taxe retenue est portee sur la reference : c'est de la qu'elle remonte
    // au registre des impots, comme celle d'un rachat.
    for (const { refId, taxe } of taxesParRef) {
      if (taxe <= 0) continue;
      await supabase
        .from("lot_references")
        .update({ regime_fiscal: "TFOP", montant_taxe: taxe })
        .eq("id", refId);
    }

    const dvClientInfo: ClientInfo = {
      civilite: deposant.civility === "M" ? "M." : "Mme",
      nom: deposant.last_name, prenom: deposant.first_name,
      adresse: deposant.address ?? undefined, codePostal: deposant.postal_code ?? undefined, ville: deposant.city ?? undefined,
      documentType: dvIdDoc?.document_type ?? undefined, documentNumber: dvIdDoc?.document_number ?? undefined,
    };

    const qdvRes = await genDoc({
      type: "quittance_depot_vente", lotId: dvLot.id, dossierId: dvDossier.id, clientId: deposant.id,
      client: dvClientInfo,
      dossier: { numeroDossier: dvDossier.numero, numeroLot: dvLot.numero, date: formatDate(now.toISOString()), heure: formatTime(now) },
      references: [],
      totaux: {
        totalBrut: totalVentes,
        taxe: totalTaxe,
        netAPayer: totalNetDeposant,
        taxeLabel: "Taxe forfaitaire (6,5%)",
      },
      quittanceDepotVenteLignes: qdvLignes, totalVentes, totalCommission, venteDossierNumero: dossier.numero,
      lotReferenceIds: (lotRefs ?? []).map((r: Ref) => r.id),
    }, "quittance_depot_vente");
    if (qdvRes.error) docErrors.push(qdvRes.error);

    // Mark DPV bijoux as vendu and update lot_references
    for (const item of items) {
      await supabase.from("bijoux_stock").update({ statut: "vendu" }).eq("id", item.stockId);
      await supabase.from("lot_references").update({ status: "vendu" }).eq("destination_stock_id", item.stockId);
    }
  }

  // L'or d'investissement se regle en deux temps quand le comptoir demande un
  // acompte, et en une seule fois sinon. Le choix se pose sur la vente avant
  // qu'elle ne soit finalisee ; passe ce point, les pieces sont emises.
  const avecAcompte = orInvestLignes.length > 0 && lot.avec_acompte !== false;

  // Phase 2: Facture de vente
  // Sans acompte, l'or d'investissement se facture avec le reste : le client
  // repart avec une seule piece et n'a qu'un versement a honorer.
  const lignesFacturees = avecAcompte ? bijouxLignes : lignes;
  if (lignesFacturees.length > 0) {
    // Le prix affiche au client est TTC : la TVA y est deja incluse. Le calcul
    // precedent l'ajoutait par-dessus — un bijou en vitrine a 1 000 EUR se
    // facturait 1 050 EUR. Ce que la facture ventile depend ensuite du regime :
    // rien sous celui de la marge, tout pour un bijou achete avec TVA a un
    // professionnel, et la seule TVA du second si la facture melange les deux.
    const { totalTTC, totalHT, tva, tvaDue, regimeMarge, mentionMarge } =
      totauxFactureVente(lignesFacturees);

    const res = await genDoc({
      type: "facture_vente", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: [],
      totaux: { totalBrut: totalHT, taxe: tva, netAPayer: totalTTC },
      factureVenteLignes: buildFactureLignes(lignesFacturees),
      totalHT, tva, totalTTC, modeReglement: libelleModeReglement(lot.mode_reglement),
      regimeMarge, mentionMarge,
    }, "facture_vente");
    if (res.error) docErrors.push(res.error);
    else if (res.path) {
      // La facture porte ce que le client voit ; le registre, ce que la
      // boutique doit. Sous le regime de la marge les deux different : la TVA
      // reste due, elle ne s'imprime simplement pas.
      await enregistrerFacture(supabase, {
        numero: res.numero, lotId: lot.id, clientId: dossier.client.id,
        montantHT: Math.round((totalTTC - tvaDue) * 100) / 100,
        montantTaxe: tvaDue,
        montantTTC: totalTTC,
      });
    }
  }

  // Factures or investissement (acompte + solde)
  if (avecAcompte) {
    const rules = await getSettingServer("business_rules");
    const acomptePct = rules?.acompte_pct ?? 10;

    const totalHT = orInvestLignes.reduce((s: number, l: VenteLigne) => s + l.prix_total, 0);
    const tva = orInvestLignes.reduce((s: number, l: VenteLigne) => s + l.montant_taxe, 0);
    const totalTTC = totalHT + tva;
    const montantAcompte = Math.round(totalTTC * (acomptePct / 100) * 100) / 100;
    const montantSolde = totalTTC - montantAcompte;

    // L'echeance du solde suit le reglage de la boutique, et non le delai de
    // retractation dont elle empruntait la constante. Les deux valent
    // quarante-huit heures par defaut, mais l'un est un droit du client et
    // l'autre une date de paiement : c'est de celle-ci que le rappel se deduit.
    const delaiSoldeH = rules?.solde_delai_heures ?? SOLDE_DELAI_DEFAUT_H;
    const dateLimite = new Date(now.getTime() + delaiSoldeH * 60 * 60 * 1000);

    const acompteRes = await genDoc({
      type: "facture_acompte", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: [],
      totaux: { totalBrut: totalHT, taxe: tva, netAPayer: totalTTC },
      factureVenteLignes: buildFactureLignes(orInvestLignes),
      totalHT, tva, totalTTC, acomptePourcentage: acomptePct, montantAcompte, montantSolde,
      dateLimiteSolde: formatDateTime(dateLimite.toISOString()),
    }, "facture_acompte");
    if (acompteRes.error) docErrors.push(acompteRes.error);
    else if (acompteRes.path) {
      // L'acompte et le solde se partagent le montant total : la taxe est
      // portée par le solde pour n'être comptée qu'une fois.
      await enregistrerFacture(supabase, {
        numero: acompteRes.numero, lotId: lot.id, clientId: dossier.client.id,
        montantHT: montantAcompte, montantTaxe: 0, montantTTC: montantAcompte,
      });
    }

    // Get acompte numero for solde reference
    const { data: acompteDoc } = await supabase
      .from("documents")
      .select("numero")
      .eq("lot_id", lot.id)
      .eq("type", "facture_acompte")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const numeroAcompte = acompteDoc?.numero ?? "";

    const soldeRes = await genDoc({
      type: "facture_solde", lotId: lot.id, dossierId: dossier.id, clientId: dossier.client.id,
      client: clientInfo, dossier: dossierInfo, references: [],
      totaux: { totalBrut: totalHT, taxe: tva, netAPayer: montantSolde },
      factureVenteLignes: buildFactureLignes(orInvestLignes),
      totalHT, tva, totalTTC, montantAcompte, montantSolde, numeroAcompte,
      modeReglement: libelleModeReglement(lot.mode_reglement), referenceNumero: numeroAcompte,
    }, "facture_solde");
    if (soldeRes.error) docErrors.push(soldeRes.error);
    else if (soldeRes.path) {
      await enregistrerFacture(supabase, {
        numero: soldeRes.numero, lotId: lot.id, clientId: dossier.client.id,
        montantHT: totalHT - montantAcompte, montantTaxe: tva, montantTTC: montantSolde,
      });
    }

    await supabase.from("lots").update({ acompte_montant: montantAcompte, date_limite_solde: dateLimite.toISOString() }).eq("id", lot.id);
  }

  if (docErrors.length > 0) {
    return { success: false, error: `Echec génération: ${docErrors.join(", ")}` };
  }

  // Bijoux stock: réserver + marquer comme livrés immédiatement
  for (const ligne of bijouxLignes) {
    if (ligne.bijoux_stock_id) {
      await supabase
        .from("bijoux_stock")
        .update({ statut: "reserve" })
        .eq("id", ligne.bijoux_stock_id);
    }
    await supabase
      .from("vente_lignes")
      .update({ is_livre: true })
      .eq("id", ligne.id);
  }

  // Toutes les lignes or investissement en attente de dispatch manuel
  for (const ligne of orInvestLignes) {
    if (!ligne.or_investissement_id) continue;
    await supabase
      .from("vente_lignes")
      .update({ fulfillment: "a_commander" })
      .eq("id", ligne.id);
  }

  const { error: lotErr } = await supabase.from("lots").update({ status: "en_cours" }).eq("id", lot.id);
  if (lotErr) return { success: false, error: `Erreur passage lot vente en cours: ${lotErr.message}` };

  return { success: true };
}
