"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateISO } from "@/lib/format";
import { MODE_REGLEMENT_OPTIONS } from "@/lib/validations/vente";
import type { BonLivraison } from "@/types/bon-livraison";

interface ReglementFonderieDialogProps {
  bdl: BonLivraison;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Encaisse ce que la fonderie verse pour un envoi traite.
 *
 * Le montant propose est la somme des valeurs reelles ligne a ligne : c'est ce
 * que le bordereau annonce. Il reste modifiable — un virement arrive parfois
 * arrondi, ou ampute de frais d'affinage.
 */
export function ReglementFonderieDialog({
  bdl,
  open,
  onOpenChange,
}: ReglementFonderieDialogProps) {
  const router = useRouter();
  const lignes = bdl.lignes ?? [];

  const attendu = lignes.reduce((somme, l) => somme + (l.valeur_reelle ?? 0), 0);

  const [montant, setMontant] = useState(attendu > 0 ? String(attendu) : "");
  const [mode, setMode] = useState("virement");
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState("");

  const montantNum = parseFloat(montant.replace(",", "."));
  const ecart = !isNaN(montantNum) ? Math.round((montantNum - attendu) * 100) / 100 : null;

  async function handleEnregistrer() {
    if (isNaN(montantNum) || montantNum <= 0) {
      setErreur("Indiquez le montant versé par la fonderie.");
      return;
    }
    setSaving(true);
    setErreur("");
    const supabase = createClient();

    // Le bon de livraison est la piece que ce versement solde : le reglement
    // s'y accroche, comme celui d'un rachat s'accroche a sa quittance.
    const { data: piece } = await supabase
      .from("documents")
      .select("id")
      .eq("bon_livraison_id", bdl.id)
      .eq("type", "bon_livraison")
      .maybeSingle();

    const { error } = await mutate(
      supabase.from("reglements").insert({
        bon_livraison_id: bdl.id,
        lot_id: null,
        document_id: piece?.id ?? null,
        fonderie_id: bdl.fonderie_id,
        // La fonderie nous paie : l'argent entre.
        sens: "entrant",
        type: "fonderie",
        montant: montantNum,
        mode,
        date_reglement: new Date(date).toISOString(),
        notes: notes || null,
      }),
      "Erreur lors de l'enregistrement du règlement",
      "Règlement enregistré"
    );

    if (error) {
      setSaving(false);
      return;
    }

    // Le document suit le sort de l'envoi : encaisse, il est regle.
    if (piece?.id) {
      await supabase.from("documents").update({ status: "regle" }).eq("id", piece.id);
    }

    const { error: statutError } = await mutate(
      supabase.from("bons_livraison").update({ statut: "paye" }).eq("id", bdl.id),
      "Le règlement est enregistré, mais le statut de l'envoi n'a pas pu être mis à jour"
    );

    setSaving(false);
    if (statutError) return;
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins size={20} weight="duotone" />
            Règlement de {bdl.fonderie?.nom ?? "la fonderie"}
          </DialogTitle>
          <DialogDescription>
            Envoi {bdl.numero} — {lignes.length} article{lignes.length > 1 ? "s" : ""},{" "}
            {attendu > 0 ? formatCurrency(attendu) : "montant non renseigné"} attendu
            d&apos;après les résultats de fonte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label required>Montant reçu</Label>
              <Input
                inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder={attendu > 0 ? String(attendu) : "0.00"}
              />
              {ecart != null && ecart !== 0 && attendu > 0 && (
                <p className={`text-xs ${ecart > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {ecart > 0 ? "+" : ""}{formatCurrency(ecart)} par rapport aux résultats
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label required>Mode</Label>
              <Select value={mode} onValueChange={(v) => { if (v) setMode(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_REGLEMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>Date du règlement</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Frais d'affinage déduits, virement partiel..."
              className="min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={saving} onClick={handleEnregistrer}>
            <Coins size={14} weight="duotone" />
            {saving ? "Enregistrement..." : "Enregistrer le règlement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
