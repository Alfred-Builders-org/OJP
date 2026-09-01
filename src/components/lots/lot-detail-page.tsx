"use client";

import { useState, useEffect, useRef } from "react";
import { CopyableText } from "@/components/ui/copyable-text";
import Link from "next/link";
import { PreviewLink } from "@/components/preview/preview-link";
import { useRouter } from "next/navigation";
import { getSettingClient } from "@/lib/settings-client";
import {
  ArrowLeft,
  ArrowSquareOut,
  Package,
  User as PhUser,
  NotePencil,
  Plus,
  PencilSimple,
  FloppyDisk,
  Diamond,
  Coins,
  Receipt,
  Warning,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/dashboard/header";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
import { RetractationTimer } from "@/components/actions/retractation-timer";
import { LotActionsCard } from "@/components/actions/lot-actions-card";

import { LotStepper } from "@/components/lots/lot-stepper";
import { ReferenceCard } from "@/components/lots/reference-card";
import { DestinationSelector } from "@/components/lots/destination-selector";
import { ReferenceFormBijoux } from "@/components/lots/reference-form-bijoux";
import { ReferenceFormOrInvest } from "@/components/lots/reference-form-or-invest";

import { DocumentsTable } from "@/components/documents/documents-table";
import { ReglementsCard } from "@/components/reglements/reglements-card";
import { detectPaymentsDue } from "@/lib/reglements/detect-payments-due";
import { TARIFS_FIXES_DEFAUT, type TarifsFixes } from "@/lib/calculations/prix-rachat";
import { LotPhotosCard } from "@/components/photos/lot-photos-card";
import { getAvailableActions } from "@/lib/actions/action-registry";
import { executeAction } from "@/lib/actions/action-executor";
import type { ActionContext } from "@/lib/actions/action-types";
import type { LotWithReferences, LotReference, LotStatus } from "@/types/lot";
import { formatDate, formatCurrency } from "@/lib/format";
import type { Reglement } from "@/types/reglement";
import type { OrInvestissement } from "@/types/or-investissement";

interface LotDetailPageProps {
  lot: LotWithReferences & {
    dossier: {
      id: string;
      numero: string;
      client: {
        id: string;
        civility: string;
        first_name: string;
        last_name: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        is_valid: boolean;
      };
    };
  };
  orInvestCatalog: OrInvestissement[];
  typeLabel?: string;
  backHref?: string;
  documents?: import("@/types/document").DocumentRecord[];
  reglements?: Reglement[];
}

export function LotDetailPage({ lot, orInvestCatalog, typeLabel, documents = [], reglements = [] }: LotDetailPageProps) {
  const router = useRouter();
  const [showFormBijoux, setShowFormBijoux] = useState(false);
  const [showFormOrInvest, setShowFormOrInvest] = useState(false);
  const [editingRef, setEditingRef] = useState<LotReference | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(lot.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retractationMs, setRetractationMs] = useState(48 * 3600_000);
  const [acomptePct, setAcomptePct] = useState(10);
  const [commissionDvPct, setCommissionDvPct] = useState(40);
  // Tarifs des matieres sans cours, lus une fois pour les formulaires.
  const [tarifs, setTarifs] = useState<TarifsFixes>(TARIFS_FIXES_DEFAUT);

  // Track latest values in refs for cleanup on navigation away
  const refsCountRef = useRef(lot.references.length);
  const statusRef = useRef(lot.status);
  useEffect(() => {
    refsCountRef.current = lot.references.length;
    statusRef.current = lot.status;
  });

  // Auto-delete empty brouillon lot when navigating away (not on strict-mode remount)
  useEffect(() => {
    const lotId = lot.id;

    function cleanupIfEmpty() {
      if (statusRef.current === "brouillon" && refsCountRef.current === 0) {
        const sb = createClient();
        sb.from("lots").delete().eq("id", lotId).then(() => {});
      }
    }

    const handleBeforeUnload = () => cleanupIfEmpty();
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Listen for Next.js client-side navigation via popstate
    const handlePopState = () => cleanupIfEmpty();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [lot.id]);

  useEffect(() => {
    getSettingClient("business_rules").then((rules) => {
      if (rules) {
        setRetractationMs(rules.retractation_heures * 3600_000);
        setAcomptePct(rules.acompte_pct);
        if (rules.commission_dv_pct) setCommissionDvPct(rules.commission_dv_pct);
      }
    });

    const supabase = createClient();
    supabase
      .from("parametres")
      .select("prix_plaque_or, prix_plaque_argent, prix_autre")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setTarifs({
          plaqueOr: Number(data.prix_plaque_or) || TARIFS_FIXES_DEFAUT.plaqueOr,
          plaqueArgent: Number(data.prix_plaque_argent) || TARIFS_FIXES_DEFAUT.plaqueArgent,
          autre: Number(data.prix_autre) || TARIFS_FIXES_DEFAUT.autre,
        });
      });
  }, []);

  const supabase = createClient();
  const isBrouillon = lot.status === "brouillon";
  const isTerminal = lot.status === "finalise";
  const isDepotVente = lot.type === "depot_vente";
  // Seuls le rachat et le dépôt-vente font entrer de la marchandise en boutique.
  const aPhotographier = lot.type === "rachat" || lot.type === "depot_vente";
  const clientName = `${lot.dossier.client.civility === "M" ? "M." : "Mme"} ${lot.dossier.client.first_name} ${lot.dossier.client.last_name}`;

  const paymentsDue = detectPaymentsDue({
    lot,
    lotReferences: lot.references,
    reglements,
    documents,
    clientId: lot.dossier.client.id,
    acompte_pct: acomptePct,
  });

  // Délai de rétractation en cours : on retient l'échéance la plus tardive parmi
  // les références concernées — c'est elle qui commande la finalisation du lot.
  const refsEnRetractation = lot.references.filter(
    (r) => r.status === "en_retractation" && r.date_fin_delai
  );
  const retractationDelai = refsEnRetractation.length
    ? refsEnRetractation.reduce((tardive, r) =>
        new Date(r.date_fin_delai!) > new Date(tardive.date_fin_delai!) ? r : tardive
      )
    : null;

  // ── Action context (used by ActionList) ─────────────────────
  const actionCtx: ActionContext = {
    lot,
    dossier: {
      id: lot.dossier.id,
      numero: lot.dossier.numero,
      client: lot.dossier.client,
    },
    retractationMs,
  };

  const availableActions = getAvailableActions({ lot, documents, paymentsDue });

  // ── Reference-level action handlers (delegated to action engine) ──
  async function handleRefAction(actionId: "ref.valider_rachat" | "ref.retracter" | "ref.accepter_devis" | "ref.refuser_devis" | "ref.restituer", refId: string) {
    const supabase = createClient();
    await executeAction({ actionId, supabase, ctx: actionCtx, referenceId: refId });
    router.refresh();
  }

  async function handleLotAction(actionId: "lot.accepter_devis" | "lot.refuser_devis") {
    const supabase = createClient();
    await executeAction({ actionId, supabase, ctx: actionCtx });
    router.refresh();
  }

  async function handleDeleteReference(refId: string) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("lot_references").delete().eq("id", refId),
      "Erreur lors de la suppression de la référence",
      "Référence supprimée"
    );
    if (error) return;
    router.refresh();
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await mutate(
      supabase
        .from("lots")
        .update({ notes: notes || null })
        .eq("id", lot.id),
      "Erreur lors de l'enregistrement des notes",
      "Notes sauvegardees"
    );
    if (error) { setSavingNotes(false); return; }
    setSavingNotes(false);
    setEditingNotes(false);
    router.refresh();
  }

  return (
    <>
      <Header
        title={lot.numero}
        backAction={
          <Button variant="ghost" size="icon-sm" aria-label="Retour" onClick={() => router.back()}>
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <LotStatusBadge status={lot.status as LotStatus} outcome={lot.outcome} />
          {lot.status === "brouillon" && (
            <Button
              size="sm"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const { error } = await mutate(
                  supabase.from("lots").update({ updated_at: new Date().toISOString() }).eq("id", lot.id),
                  "Erreur lors de l'enregistrement du lot",
                  "Lot enregistre"
                );
                setSaving(false);
                if (error) return;
                router.push(`/dossiers/${lot.dossier_id}`);
              }}
            >
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lot info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} weight="duotone" />
                Informations du lot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailRow label="Numero" value={lot.numero} />
              <DetailRow label="Type" value={typeLabel ?? "Rachat"} />
              <DetailRow label="Dossier" value={
                <span className="inline-flex items-center gap-1.5">
                  {lot.dossier.numero}
                  <PreviewLink entityType="dossier" entityId={lot.dossier.id} href={`/dossiers/${lot.dossier.id}`}>
                    <ArrowSquareOut size={14} weight="duotone" className="text-muted-foreground hover:text-foreground transition-colors" />
                  </PreviewLink>
                </span>
              } />
              <DetailRow label="Date de creation" value={formatDate(lot.created_at)} />
              {lot.date_acceptation && (
                <DetailRow label="Date d'acceptation" value={formatDate(lot.date_acceptation)} />
              )}
              {lot.date_finalisation && (
                <DetailRow label="Date de finalisation" value={formatDate(lot.date_finalisation)} />
              )}
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PhUser size={20} weight="duotone" />
                Client
              </CardTitle>
              <PreviewLink entityType="client" entityId={lot.dossier.client.id} href={`/clients/${lot.dossier.client.id}`}>
                <Button variant="secondary" size="sm">
                  <ArrowSquareOut size={14} weight="duotone" />
                  Voir le client
                </Button>
              </PreviewLink>
            </CardHeader>
            <CardContent>
              <DetailRow label="Nom" value={
                <span className="inline-flex items-center gap-2">
                  {clientName}
                  <Badge
                    variant={lot.dossier.client.is_valid ? "default" : "destructive"}
                    className={lot.dossier.client.is_valid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30" : ""}
                  >
                    {lot.dossier.client.is_valid ? "Valide" : "Non valide"}
                  </Badge>
                </span>
              } />
              <DetailRow label="Telephone" value={lot.dossier.client.phone ? <CopyableText value={lot.dossier.client.phone} /> : "—"} />
              <DetailRow label="Email" value={lot.dossier.client.email ? <CopyableText value={lot.dossier.client.email} /> : "—"} />
              <DetailRow label="Ville" value={lot.dossier.client.city ?? "—"} />
            </CardContent>
          </Card>

          {/* Photos du lot. Exigées sur un rachat comme sur un dépôt-vente :
              c'est la preuve de ce que le client a remis, et le seul recours si
              la composition du lot venait à être contestée.

              Sur une demi-largeur, côte à côte avec les cours : une galerie de
              vignettes n'a pas besoin de toute la fiche, et les deux cartes se
              répondent — ce qui est entré, et à quel cours il a été payé. */}
          {aPhotographier && (
            <LotPhotosCard lotId={lot.id} numero={lot.numero} disabled={isTerminal} />
          )}

          {/* Cours appliqués — carte à part, sous les informations client.
              Noyés parmi les dates du lot, ils étaient illisibles alors que ce
              sont eux qui expliquent chaque montant de la fiche. */}
          <Card className={aPhotographier ? undefined : "md:col-span-2"}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Coins size={20} weight="duotone" />
                Cours appliqués
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                figés à la création du lot
              </span>
            </CardHeader>
            <CardContent>
              <CoursAppliques
                or={lot.cours_or_snapshot}
                argent={lot.cours_argent_snapshot}
                platine={lot.cours_platine_snapshot}
                coefficient={lot.coefficient_rachat_snapshot}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stepper */}
        <LotStepper
          lotType={lot.type as "rachat" | "depot_vente"}
          lotStatus={lot.status}
          hasDevis={lot.references.some((r) => r.type_rachat === "devis")}
          allRefsTerminal={lot.references.length > 0 && lot.references.every((r) =>
            ["finalise", "retracte", "devis_refuse", "vendu", "rendu_client"].includes(r.status)
          )}
          isError={lot.outcome === "retracte" || lot.outcome === "refuse"}
          referenceStatuses={lot.references.map((r) => r.status)}
        />

        {/* Délai de rétractation — barre de progression et compte à rebours.
            Branché sur les références et non sur le lot : `date_fin_retractation`
            n'est renseignée que dans le parcours devis, jamais en rachat direct,
            où le délai court pourtant bel et bien. */}
        {retractationDelai && (
          <RetractationTimer
            startDate={retractationDelai.date_envoi}
            endDate={retractationDelai.date_fin_delai}
          />
        )}

        {/* Destination des articles — modifiable tant que le lot n'est pas soldé.
            Un lot de dépôt-vente n'est pas concerné : sa marchandise part chez
            le déposant, pas en stock ni en fonderie. */}
        {!isTerminal && lot.type !== "depot_vente" && lot.references.length > 0 && (
          <DestinationSelector lot={lot} />
        )}

        {/* Actions en attente */}
        {!isBrouillon && !isTerminal && (
          <LotActionsCard
            actions={availableActions}
            ctx={actionCtx}
            lot={lot}
            dossierClient={lot.dossier.client}
            lotId={lot.id}
          />
        )}

        {/* References section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package size={20} weight="duotone" />
              Références ({lot.references.length})
            </CardTitle>
            {isBrouillon && (
              isDepotVente ? (
                <Button variant="secondary" size="sm" onClick={() => { setShowFormBijoux(true); setShowFormOrInvest(false); }}>
                  <Plus size={14} weight="bold" />
                  Référence
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="secondary" size="sm">
                        <Plus size={14} weight="bold" />
                        Référence
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => { setShowFormBijoux(true); setShowFormOrInvest(false); }}
                    >
                      <Diamond size={16} weight="duotone" />
                      Bijoux
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setShowFormOrInvest(true); setShowFormBijoux(false); }}
                    >
                      <Coins size={16} weight="duotone" />
                      Or Investissement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {showFormBijoux && (
              <ReferenceFormBijoux
                lotId={lot.id}
                coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                coefficientSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                onClose={() => setShowFormBijoux(false)}
                lotType={isDepotVente ? "depot_vente" : "rachat"}
                commissionDvPct={commissionDvPct}
                tarifs={tarifs}
              />
            )}
            {showFormOrInvest && (
              <ReferenceFormOrInvest
                lotId={lot.id}
                coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                coefficientRachatSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                catalog={orInvestCatalog}
                onClose={() => setShowFormOrInvest(false)}
              />
            )}
            {lot.references.length === 0 && !showFormBijoux && !showFormOrInvest ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune reference. Ajoutez des bijoux ou de l&apos;or investissement.
              </p>
            ) : (
              lot.references.map((ref) => (
                editingRef?.id === ref.id ? (
                  ref.categorie === "bijoux" ? (
                    <ReferenceFormBijoux
                      key={ref.id}
                      lotId={lot.id}
                      coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                      coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                      coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                      coefficientSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                      coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                      onClose={() => setEditingRef(null)}
                      editData={ref}
                      lotType={isDepotVente ? "depot_vente" : "rachat"}
                      commissionDvPct={commissionDvPct}
                      tarifs={tarifs}
                    />
                  ) : (
                    <ReferenceFormOrInvest
                      key={ref.id}
                      lotId={lot.id}
                      coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                      coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                      coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                      coefficientRachatSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                      coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                      catalog={orInvestCatalog}
                      onClose={() => setEditingRef(null)}
                      editData={ref}
                    />
                  )
                ) : (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onDelete={handleDeleteReference}
                  onEdit={(r) => setEditingRef(r)}
                  canEdit={isBrouillon}
                  onRestituer={(id) => handleRefAction("ref.restituer", id)}
                  canRestituer={isDepotVente && lot.status === "finalise"}
                  hideTypeRachat={isDepotVente}
                  isDepotVente={isDepotVente}
                  onValiderRachat={(id) => handleRefAction("ref.valider_rachat", id)}
                  onRetracter={(id) => handleRefAction("ref.retracter", id)}
                  onAccepterDevis={(id) => handleRefAction("ref.accepter_devis", id)}
                  onRefuserDevis={(id) => handleRefAction("ref.refuser_devis", id)}
                />
                )
              ))
            )}

            {/* Récapitulatif prix */}
            {lot.references.length > 0 && (() => {
              const totalBrut = lot.references.reduce((sum, r) => sum + r.prix_achat * r.quantite, 0);

              if (isDepotVente) {
                const totalRevente = lot.references.reduce((sum, r) => sum + (r.prix_revente_estime ?? 0) * r.quantite, 0);
                const totalCommission = totalRevente - totalBrut;
                return (
                  <div className="rounded-lg border bg-muted/50 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt size={16} weight="duotone" className="text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Récapitulatif</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Prix affiché</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalRevente)}</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Commission ({commissionDvPct} %)</span>
                        <span className="font-medium text-muted-foreground">− {formatCurrency(totalCommission)}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Prix net déposant</span>
                        <span className="text-lg font-bold">{formatCurrency(totalBrut)}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              const totalTPV = lot.references
                .filter((r) => r.regime_fiscal === "TPV")
                .reduce((sum, r) => sum + r.montant_taxe * r.quantite, 0);
              const totalTMP = lot.references
                .filter((r) => r.regime_fiscal === "TMP")
                .reduce((sum, r) => sum + r.montant_taxe * r.quantite, 0);
              const totalTFOP = lot.references
                .filter((r) => r.regime_fiscal === "TFOP")
                .reduce((sum, r) => sum + r.montant_taxe * r.quantite, 0);
              const totalTaxe = totalTPV + totalTMP + totalTFOP;
              const totalNet = totalBrut - totalTaxe;
              const taxeLineCount = (totalTPV > 0 ? 1 : 0) + (totalTMP > 0 ? 1 : 0) + (totalTFOP > 0 ? 1 : 0);
              return (
                <div className="rounded-lg border bg-muted/50 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt size={16} weight="duotone" className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Récapitulatif</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">Prix brut</span>
                    <span className="font-semibold text-foreground">{formatCurrency(totalBrut)} HT</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {totalTPV > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">TPV (Taxe sur les Plus-Values)</span>
                        <span className="font-medium text-muted-foreground">− {formatCurrency(totalTPV)}</span>
                      </div>
                    )}
                    {totalTMP > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">TMP (Taxe sur les Métaux Précieux)</span>
                        <span className="font-medium text-muted-foreground">− {formatCurrency(totalTMP)}</span>
                      </div>
                    )}
                    {totalTFOP > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">TFOP (Taxe Forfaitaire Objets Précieux)</span>
                        <span className="font-medium text-muted-foreground">− {formatCurrency(totalTFOP)}</span>
                      </div>
                    )}
                    {totalTaxe > 0 && taxeLineCount > 1 && (
                      <div className="border-t pt-1 mt-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">Total taxes</span>
                        <span className="font-semibold text-foreground">− {formatCurrency(totalTaxe)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Prix de rachat net</span>
                      <span className="text-lg font-bold">{formatCurrency(totalNet)} TTC</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Documents — la ligne du devis porte ses deux décisions. Le tableau
            prévoyait ce point d'extension depuis l'origine ; aucun appelant ne
            s'en servait, si bien qu'Accepter et Refuser n'existaient que dans la
            carte des actions en attente. */}
        <DocumentsTable
          documents={documents}
          rowActions={(doc) =>
            doc.type === "devis_rachat" &&
            doc.status === "en_attente" &&
            lot.references.some((r) => r.status === "devis_envoye") ? (
              <>
                <DropdownMenuItem onClick={() => handleLotAction("lot.accepter_devis")}>
                  <CheckCircle size={16} weight="duotone" />
                  Accepter le devis
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleLotAction("lot.refuser_devis")}
                >
                  <XCircle size={16} weight="duotone" />
                  Refuser le devis
                </DropdownMenuItem>
              </>
            ) : null
          }
        />

        {/* Reglements */}
        {(lot.type === "rachat" || lot.type === "depot_vente") && lot.status !== "brouillon" && (
          <ReglementsCard
            lotId={lot.id}
            reglements={reglements}
            paymentsDue={paymentsDue}
          />
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <NotePencil size={20} weight="duotone" />
              Notes
            </CardTitle>
            {editingNotes ? (
              <Button variant="secondary" size="sm" disabled={savingNotes} onClick={handleSaveNotes}>
                <FloppyDisk size={14} weight="duotone" />
                {savingNotes ? "Enregistrement..." : "Enregistrer"}
              </Button>
            ) : (
              !isTerminal && (
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingNotes(true)} aria-label="Modifier les notes">
                  <PencilSimple size={16} weight="duotone" />
                </Button>
              )
            )}
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes sur le lot..."
                className="min-h-[100px] resize-none"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {lot.notes ?? "Aucune note."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DetailRow({ label, value, noBorder }: { label: string; value: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${noBorder ? "" : "border-b last:border-0"}`}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

/**
 * Cours et coefficient figés à la création du lot. Ce sont eux — et non les
 * paramètres du jour — qui déterminent les prix proposés sur ce lot, d'où
 * l'intérêt de les rendre visibles au moment d'expertiser.
 */
function CoursAppliques({
  or,
  argent,
  platine,
  coefficient,
}: {
  or: number | null;
  argent: number | null;
  platine: number | null;
  coefficient: number | null;
}) {
  const metaux = [
    { label: "Or", valeur: or },
    { label: "Argent", valeur: argent },
    { label: "Platine", valeur: platine },
  ].filter((m) => m.valeur != null && m.valeur > 0);

  if (metaux.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/10 dark:text-amber-400">
        <Warning size={16} weight="duotone" className="mt-0.5 shrink-0" />
        <span>
          Aucun cours n&apos;est associé à ce lot : les prix proposés seront à
          zéro. Renseignez les cours dans les paramètres, puis créez un nouveau
          lot.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {metaux.map((m) => (
        <Badge key={m.label} variant="outline" className="font-normal tabular-nums">
          {m.label} {formatCoursGramme(m.valeur as number)}
        </Badge>
      ))}
      {coefficient != null && coefficient > 0 && (
        <Badge variant="outline" className="font-normal tabular-nums">
          Coefficient &times;{formatNombre(coefficient)}
        </Badge>
      )}
    </div>
  );
}

/**
 * Les cours sont stockés au millième d'euro : on les affiche tels quels plutôt
 * qu'arrondis au centime, pour que le montant proposé sur une référence puisse
 * être refait à la calculatrice.
 */
function formatCoursGramme(valeur: number): string {
  return `${formatNombre(valeur, 3)} €/g`;
}

function formatNombre(valeur: number, maxDecimales = 4): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimales,
  }).format(valeur);
}
