"use client";

import { FieldError } from "@/components/ui/field";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyEur, CreditCard, Bank, Money, Check, FloppyDisk, ArrowDown, ArrowUp, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { statutsPourDestination } from "@/lib/stock/destination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import type { PaymentDue } from "@/lib/reglements/detect-payments-due";
import { formatCurrency } from "@/lib/format";
import type { ModeReglement } from "@/types/reglement";

const MODE_OPTIONS: { value: ModeReglement; label: string; icon: typeof Money }[] = [
  { value: "especes", label: "Especes", icon: Money },
  { value: "carte", label: "Carte bancaire", icon: CreditCard },
  { value: "virement", label: "Virement", icon: Bank },
  { value: "cheque", label: "Cheque", icon: Check },
];

interface ReglementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDue: PaymentDue;
  lotId: string;
}

/** Une ligne de règlement : un montant, un moyen de paiement. */
interface LigneReglement {
  montant: string;
  mode: ModeReglement | "";
}

export function ReglementDialog({ open, onOpenChange, paymentDue, lotId }: ReglementDialogProps) {
  const router = useRouter();
  // Un règlement se fait souvent en plusieurs fois et par plusieurs canaux —
  // tant en carte, tant en espèces, le reste par chèque. Le dialogue n'acceptait
  // qu'un montant et un mode, obligeant à le rouvrir autant de fois.
  const [lignes, setLignes] = useState<LigneReglement[]>([
    { montant: paymentDue.pre_fill.montant.toString(), mode: "" },
  ]);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSortant = paymentDue.sens === "sortant";

  const totalSaisi = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.montant) || 0),
    0
  );

  function majLigne(index: number, patch: Partial<LigneReglement>) {
    setLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  }

  function ajouterLigne() {
    // La nouvelle ligne est pré-remplie avec ce qu'il reste à couvrir.
    const reste = Math.round((paymentDue.montant_restant - totalSaisi) * 100) / 100;
    setLignes((prev) => [
      ...prev,
      { montant: reste > 0 ? reste.toString() : "", mode: "" },
    ]);
  }

  function retirerLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (lignes.some((l) => !l.mode)) {
      setError("Chaque ligne doit porter un moyen de paiement.");
      return;
    }

    if (lignes.some((l) => !(parseFloat(l.montant) > 0))) {
      setError("Chaque montant doit être positif.");
      return;
    }

    const montantNum = Math.round(totalSaisi * 100) / 100;

    // `lots.mode_reglement` ne retient qu'un moyen. Sur un paiement fractionné,
    // on garde celui qui porte la plus grosse part — le plus représentatif.
    const modePrincipal = [...lignes].sort(
      (a, b) => (parseFloat(b.montant) || 0) - (parseFloat(a.montant) || 0)
    )[0].mode as ModeReglement;

    setSaving(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("reglements").insert(
      lignes.map((l) => ({
        lot_id: lotId,
        bon_commande_id: paymentDue.pre_fill.bon_commande_id ?? null,
        document_id: paymentDue.pre_fill.document_id ?? null,
        sens: paymentDue.sens,
        type: paymentDue.type,
        montant: Math.round(parseFloat(l.montant) * 100) / 100,
        mode: l.mode,
        date_reglement: date.toISOString(),
        client_id: paymentDue.pre_fill.client_id ?? null,
        fonderie_id: paymentDue.pre_fill.fonderie_id ?? null,
        notes: notes || null,
      }))
    );

    if (insertError) {
      // Le garde-fou de la base (migration 135) refuse de payer un client sur
      // une opération rétractée, refusée ou annulée. Son message est déjà
      // rédigé pour être lu tel quel ; les autres erreurs restent techniques.
      setError(
        insertError.message.includes("operation est close")
          ? insertError.message
          : `Le règlement n'a pas pu être enregistré. ${insertError.message}`,
      );
      setSaving(false);
      return;
    }

    toast.success("Règlement enregistré");

    const newTotal = paymentDue.montant_deja_paye + montantNum;
    const isFullyPaid = newTotal >= paymentDue.montant_attendu - 0.01;

    // If fonderie payment covers the full amount, update bon_commande statut
    if (paymentDue.type === "fonderie" && paymentDue.pre_fill.bon_commande_id) {
      if (isFullyPaid) {
        const { error: bdcError } = await supabase
          .from("bons_commande")
          .update({ statut: "paye", updated_at: new Date().toISOString() })
          .eq("id", paymentDue.pre_fill.bon_commande_id);
        if (bdcError) { toast.error("Erreur lors de la mise à jour du bon de commande"); }
      }
    }

    // Update document status when payment covers the full amount
    if (paymentDue.pre_fill.document_id && isFullyPaid) {
      await supabase
        .from("documents")
        .update({ status: "regle" })
        .eq("id", paymentDue.pre_fill.document_id)
        .neq("status", "regle");
    }

    // Auto-finaliser les refs après paiement rachat (or invest + bijoux)
    if (isFullyPaid && paymentDue.type === "rachat" && paymentDue.pre_fill.document_id) {
      // Récupérer les refs liées à la quittance
      const { data: docRefs } = await supabase
        .from("document_references")
        .select("lot_reference_id")
        .eq("document_id", paymentDue.pre_fill.document_id);

      const refIds = (docRefs ?? []).map((dr: { lot_reference_id: string }) => dr.lot_reference_id);
      if (refIds.length > 0) {
        // Récupérer toutes les refs en attente de paiement
        const { data: pendingRefs } = await supabase
          .from("lot_references")
          .select("id, categorie, or_investissement_id, quantite, designation, metal, qualite, poids, poids_brut, poids_net, prix_achat, prix_revente_estime, destination")
          .in("id", refIds)
          .eq("status", "en_attente_paiement");

        for (const ref of pendingRefs ?? []) {
          // Or investissement: incrémenter le stock
          if (ref.or_investissement_id) {
            await supabase.rpc("increment_or_invest_quantite", {
              p_id: ref.or_investissement_id,
              p_qty: ref.quantite,
            });
          }

          // Bijoux: créer l'entrée stock selon la destination choisie sur le lot.
          // Elle valait « a_fondre » quel que soit le choix de l'utilisateur, et
          // la page Stock excluait précisément ce statut.
          if (ref.categorie === "bijoux") {
            const { data: stockEntry } = await supabase.from("bijoux_stock").insert({
              nom: ref.designation, metaux: ref.metal, qualite: ref.qualite,
              poids: ref.poids_net ?? ref.poids, poids_brut: ref.poids_brut, poids_net: ref.poids_net,
              prix_achat: ref.prix_achat, prix_revente: ref.prix_revente_estime, quantite: ref.quantite,
              statut: statutsPourDestination(ref.destination, false).stock,
            }).select("id").single();

            if (stockEntry) {
              await supabase.from("lot_references")
                .update({ destination_stock_id: stockEntry.id })
                .eq("id", ref.id);
            }
          }
        }

        // Finaliser les refs
        await supabase
          .from("lot_references")
          .update({ status: "finalise" })
          .in("id", refIds)
          .eq("status", "en_attente_paiement");
      }

      // Vérifier si le lot peut être finalisé
      const { data: lot } = await supabase
        .from("lots")
        .select("id, status, dossier_id")
        .eq("id", lotId)
        .single();

      if (lot && lot.status === "en_cours") {
        const { data: allRefs } = await supabase
          .from("lot_references")
          .select("status")
          .eq("lot_id", lotId);

        const terminalStatuses = ["finalise", "devis_refuse", "retracte", "rendu_client", "vendu"];
        const allTerminal = (allRefs ?? []).every(
          (r: { status: string }) => terminalStatuses.includes(r.status)
        );

        if (allTerminal) {
          await supabase.from("lots").update({
            status: "finalise",
            outcome: "complete",
            date_finalisation: new Date().toISOString(),
          }).eq("id", lotId);

          // Vérifier si le dossier peut être finalisé
          const { data: allLots } = await supabase
            .from("lots")
            .select("status")
            .eq("dossier_id", lot.dossier_id);

          if ((allLots ?? []).every((l: { status: string }) => l.status === "finalise")) {
            await supabase.from("dossiers").update({ status: "finalise" }).eq("id", lot.dossier_id);
          }

          toast.success("Rachat finalisé automatiquement");
        }
      }
    }

    // Auto-valider les confiés d'achat après paiement quittance DPV
    if (isFullyPaid && paymentDue.type === "depot_vente" && paymentDue.pre_fill.document_id) {
      // Récupérer les refs liées à la quittance DPV
      const { data: qdvDocRefs } = await supabase
        .from("document_references")
        .select("lot_reference_id")
        .eq("document_id", paymentDue.pre_fill.document_id);

      const qdvRefIds = (qdvDocRefs ?? []).map((dr: { lot_reference_id: string }) => dr.lot_reference_id);

      if (qdvRefIds.length > 0) {
        // Trouver les confiés d'achat liés à ces refs et les valider
        const { data: confieDocRefs } = await supabase
          .from("document_references")
          .select("document_id, lot_reference_id")
          .in("lot_reference_id", qdvRefIds);

        const confieDocIds = [...new Set((confieDocRefs ?? []).map((dr: { document_id: string }) => dr.document_id))];
        if (confieDocIds.length > 0) {
          await supabase
            .from("documents")
            .update({ status: "regle" })
            .in("id", confieDocIds)
            .eq("type", "confie_achat");
        }
      }

      // Vérifier si tous les confiés du lot sont réglés → valider contrat DPV + lot
      const { data: lot } = await supabase
        .from("lots")
        .select("id, status, dossier_id")
        .eq("id", lotId)
        .single();

      if (lot) {
        const { data: lotDocs } = await supabase
          .from("documents")
          .select("type, status")
          .eq("lot_id", lotId);

        const allConfiesRegles = (lotDocs ?? [])
          .filter((d: { type: string }) => d.type === "confie_achat")
          .every((d: { status: string }) => d.status === "regle");

        if (allConfiesRegles) {
          // Signer le contrat DPV
          await supabase
            .from("documents")
            .update({ status: "signe" })
            .eq("lot_id", lotId)
            .eq("type", "contrat_depot_vente");

          // Finaliser le lot DPV si toutes les refs sont terminales
          const { data: allRefs } = await supabase
            .from("lot_references")
            .select("status")
            .eq("lot_id", lotId);

          const terminalStatuses = ["finalise", "vendu", "rendu_client"];
          const allTerminal = (allRefs ?? []).every(
            (r: { status: string }) => terminalStatuses.includes(r.status)
          );

          if (allTerminal) {
            await supabase.from("lots").update({
              status: "finalise", outcome: "complete", date_finalisation: new Date().toISOString(),
            }).eq("id", lotId);

            const { data: allLots } = await supabase
              .from("lots")
              .select("status")
              .eq("dossier_id", lot.dossier_id);

            if ((allLots ?? []).every((l: { status: string }) => l.status === "finalise")) {
              await supabase.from("dossiers").update({ status: "finalise" }).eq("id", lot.dossier_id);
            }

            toast.success("Dépôt-vente finalisé automatiquement");
          }
        }
      }
    }

    // Auto-finaliser la vente si toutes les conditions sont remplies
    if (isFullyPaid && ["vente", "acompte", "solde", "fonderie"].includes(paymentDue.type)) {
      const { data: lot } = await supabase
        .from("lots")
        .select("id, type, status, dossier_id")
        .eq("id", lotId)
        .single();

      if (lot && lot.type === "vente" && lot.status === "en_cours") {
        // Condition 1 : Toutes les factures client réglées
        const { data: lotDocs } = await supabase
          .from("documents")
          .select("id, status, type")
          .eq("lot_id", lotId)
          .in("type", ["facture_vente", "facture_acompte", "facture_solde"]);
        const unregled = (lotDocs ?? []).filter(
          (d) => d.status !== "regle" && d.id !== paymentDue.pre_fill.document_id
        );
        const allFacturesReglees = unregled.length === 0;

        // Condition 2 : Tous les items or invest fulfillés (servi_stock ou recu) ET livrés
        const { data: orInvestLignes } = await supabase
          .from("vente_lignes")
          .select("fulfillment, is_livre")
          .eq("lot_id", lotId)
          .not("or_investissement_id", "is", null);
        const allOrInvestFulfilled = (orInvestLignes ?? []).every(
          (l: { fulfillment: string; is_livre: boolean }) =>
            (l.fulfillment === "servi_stock" || l.fulfillment === "recu") && l.is_livre,
        );

        // Condition 3 : Tous les BDC fonderie payés
        const { data: lotBdcLignes } = await supabase
          .from("vente_lignes")
          .select("bon_commande_id")
          .eq("lot_id", lotId)
          .not("bon_commande_id", "is", null);
        const bdcIds = [...new Set((lotBdcLignes ?? []).map((l: { bon_commande_id: string }) => l.bon_commande_id))];
        let allBdcPaid = true;
        if (bdcIds.length > 0) {
          const { data: bdcs } = await supabase
            .from("bons_commande")
            .select("statut")
            .in("id", bdcIds);
          allBdcPaid = (bdcs ?? []).every(
            (b: { statut: string }) => b.statut === "paye" || b.statut === "annule"
          );
        }

        // Condition 4 : Toutes les lignes livrées au client
        const { data: allVenteLignes } = await supabase.from("vente_lignes").select("is_livre").eq("lot_id", lotId);
        const allLivre = (allVenteLignes ?? []).every((l: { is_livre: boolean }) => l.is_livre);

        // Toutes les conditions remplies → finaliser
        if (allFacturesReglees && allOrInvestFulfilled && allBdcPaid && allLivre) {
          // Marquer les bijoux comme vendus
          const { data: bijouxLignes } = await supabase
            .from("vente_lignes")
            .select("bijoux_stock_id, prix_total, designation")
            .eq("lot_id", lotId)
            .not("bijoux_stock_id", "is", null);

          const dvItemsByLot = new Map<string, Array<{ stockId: string; prixVente: number; designation: string }>>();

          for (const ligne of bijouxLignes ?? []) {
            if (!ligne.bijoux_stock_id) continue;

            const { data: stockItem } = await supabase
              .from("bijoux_stock")
              .select("depot_vente_lot_id")
              .eq("id", ligne.bijoux_stock_id)
              .single();

            await supabase
              .from("bijoux_stock")
              .update({ statut: "vendu" })
              .eq("id", ligne.bijoux_stock_id);

            if (stockItem?.depot_vente_lot_id) {
              await supabase
                .from("lot_references")
                .update({ status: "vendu" })
                .eq("destination_stock_id", ligne.bijoux_stock_id);

              const existing = dvItemsByLot.get(stockItem.depot_vente_lot_id) ?? [];
              existing.push({ stockId: ligne.bijoux_stock_id, prixVente: ligne.prix_total, designation: ligne.designation });
              dvItemsByLot.set(stockItem.depot_vente_lot_id, existing);
            }
          }

          // Quittances DPV already generated server-side in processVenteLot

          // Finaliser le lot de vente
          await supabase.from("lots").update({
            status: "finalise",
            outcome: "complete",
            date_finalisation: new Date().toISOString(),
            date_reglement: new Date().toISOString(),
            solde_paye: true,
            date_solde: new Date().toISOString(),
            mode_reglement: modePrincipal,
          }).eq("id", lotId);

          // Check finalisation lots DPV source
          for (const dvLotId of dvItemsByLot.keys()) {
            const { data: dvRefs } = await supabase
              .from("lot_references")
              .select("status")
              .eq("lot_id", dvLotId);
            const allDone = (dvRefs ?? []).every(
              (r: { status: string }) => ["vendu", "rendu_client", "finalise"].includes(r.status)
            );
            if (allDone) {
              const { data: dvLot } = await supabase.from("lots").select("dossier_id").eq("id", dvLotId).single();
              await supabase.from("lots").update({ status: "finalise", outcome: "complete", date_finalisation: new Date().toISOString() }).eq("id", dvLotId);
              if (dvLot) {
                const { data: allDvLots } = await supabase.from("lots").select("status").eq("dossier_id", dvLot.dossier_id);
                if ((allDvLots ?? []).every((l: { status: string }) => l.status === "finalise")) {
                  await supabase.from("dossiers").update({ status: "finalise" }).eq("id", dvLot.dossier_id);
                }
              }
            }
          }

          // Check finalisation dossier de vente
          const { data: allLots } = await supabase.from("lots").select("status").eq("dossier_id", lot.dossier_id);
          if ((allLots ?? []).every((l: { status: string }) => l.status === "finalise")) {
            await supabase.from("dossiers").update({ status: "finalise" }).eq("id", lot.dossier_id);
          }

          toast.success("Vente finalisée automatiquement");
        }
      }
    }

    setSaving(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CurrencyEur size={20} weight="duotone" />
            Enregistrer un règlement
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                isSortant
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              }
            >
              {isSortant ? (
                <><ArrowUp size={10} weight="bold" className="mr-0.5" /> Sortant</>
              ) : (
                <><ArrowDown size={10} weight="bold" className="mr-0.5" /> Entrant</>
              )}
            </Badge>
            {paymentDue.label}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FieldError>{error}</FieldError>}

          {/* Info box */}
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <p className="text-muted-foreground">{paymentDue.description}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Montant attendu</span>
              <span className="font-semibold">{formatCurrency(paymentDue.montant_attendu)}</span>
            </div>
            {paymentDue.montant_deja_paye > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Déjà réglé</span>
                <span className="text-emerald-600 font-medium">
                  {formatCurrency(paymentDue.montant_deja_paye)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border mt-1 pt-1">
              <span className="font-medium">Reste à régler</span>
              <span className="font-bold text-base">{formatCurrency(paymentDue.montant_restant)}</span>
            </div>
          </div>

          {/* Montants et moyens de paiement — une ligne par canal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Montant et moyen de paiement</Label>
              <Button type="button" variant="ghost" size="sm" onClick={ajouterLigne}>
                <Plus size={14} weight="regular" />
                Ajouter un moyen
              </Button>
            </div>

            {lignes.map((ligne, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-32"
                  value={ligne.montant}
                  onChange={(e) => majLigne(index, { montant: e.target.value })}
                  aria-label={`Montant ${index + 1}`}
                  required
                />
                <Select
                  value={ligne.mode}
                  onValueChange={(v) => majLigne(index, { mode: v as ModeReglement })}
                >
                  <SelectTrigger className="flex-1">
                    {ligne.mode ? (
                      <span className="flex items-center gap-2">
                        {(() => { const opt = MODE_OPTIONS.find(o => o.value === ligne.mode); if (!opt) return null; const Icon = opt.icon; return <><Icon size={14} weight="duotone" />{opt.label}</>; })()}
                      </span>
                    ) : (
                      <SelectValue placeholder="Choisir un moyen" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} weight="duotone" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {lignes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Retirer la ligne ${index + 1}`}
                    onClick={() => retirerLigne(index)}
                  >
                    <Trash size={14} weight="regular" />
                  </Button>
                )}
              </div>
            ))}

            {lignes.length > 1 && (
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-muted-foreground">Total saisi</span>
                <span className="font-medium">{formatCurrency(totalSaisi)}</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date du reglement</Label>
            <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Référence, commentaire..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving || lignes.some((l) => !l.mode)}>
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
