"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, FloppyDisk } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
  selectItems,
} from "@/components/ui/select";
import { METAL_COURS_OPTIONS } from "@/lib/validations/lot";
import type { OrInvestissement } from "@/types/or-investissement";

interface PieceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reçoit la pièce créée, pour la sélectionner aussitôt dans le lot. */
  onCreated: (piece: OrInvestissement) => void;
  /** Pré-remplit la recherche déjà saisie dans le catalogue. */
  designationInitiale?: string;
}

/**
 * Création d'une pièce du catalogue depuis un lot.
 *
 * Un client se présente avec un napoléon que le catalogue ne connaît pas : il
 * fallait jusqu'ici quitter le lot, aller au catalogue, créer la pièce, puis
 * revenir et tout ressaisir. La pièce se crée maintenant sans quitter le rachat,
 * et se trouve sélectionnée dans la foulée.
 */
export function PieceCreateDialog({
  open,
  onOpenChange,
  onCreated,
  designationInitiale = "",
}: PieceCreateDialogProps) {
  const [designation, setDesignation] = useState(designationInitiale);
  const [metal, setMetal] = useState("Or");
  const [poids, setPoids] = useState("");
  const [titre, setTitre] = useState("");
  const [pays, setPays] = useState("");
  const [annees, setAnnees] = useState("");
  const [coefficientAchat, setCoefficientAchat] = useState("");
  const [coefficientVente, setCoefficientVente] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setDesignation("");
    setMetal("Or");
    setPoids("");
    setTitre("");
    setPays("");
    setAnnees("");
    setCoefficientAchat("");
    setCoefficientVente("");
    setErrors({});
  }

  async function handleSubmit() {
    const champs: Record<string, string> = {};
    if (!designation.trim()) champs.designation = "La désignation est requise";
    const poidsNum = parseFloat(poids);
    if (!(poidsNum > 0)) champs.poids = "Le poids doit être positif";

    // Les coefficients sont facultatifs : vides, la pièce suit ceux des
    // paramètres. Renseignés, ils doivent rester dans des bornes plausibles.
    const coefA = coefficientAchat ? parseFloat(coefficientAchat) : null;
    const coefV = coefficientVente ? parseFloat(coefficientVente) : null;
    if (coefA !== null && (isNaN(coefA) || coefA <= 0 || coefA > 3)) {
      champs.coefficient_achat = "Coefficient attendu entre 0 et 3";
    }
    if (coefV !== null && (isNaN(coefV) || coefV <= 0 || coefV > 3)) {
      champs.coefficient_vente = "Coefficient attendu entre 0 et 3";
    }

    if (Object.keys(champs).length > 0) {
      setErrors(champs);
      return;
    }

    setErrors({});
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("or_investissement")
      .insert({
        designation: designation.trim(),
        metal,
        poids: poidsNum,
        titre: titre.trim() || null,
        pays: pays.trim() || null,
        annees: annees.trim() || null,
        coefficient_achat: coefA,
        coefficient_vente: coefV,
        quantite: 0,
      })
      .select()
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error("La pièce n'a pas pu être créée");
      return;
    }

    toast.success("Pièce ajoutée au catalogue");
    onCreated(data as OrInvestissement);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins size={20} weight="duotone" />
            Nouvelle pièce au catalogue
          </DialogTitle>
          <DialogDescription>
            Elle sera sélectionnée pour cette référence et restera disponible pour
            les prochains rachats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Field label="Désignation" required error={errors.designation}>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Napoléon 20 francs"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Métal" required>
              <Select value={metal} onValueChange={(v) => setMetal(v ?? "Or")}>
                <SelectTrigger>
                  <SelectValue items={selectItems(METAL_COURS_OPTIONS)} />
                </SelectTrigger>
                <SelectContent>
                  {METAL_COURS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Poids (g)" required error={errors.poids}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder="6.45"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Titre">
              <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="900" />
            </Field>
            <Field label="Pays">
              <Input value={pays} onChange={(e) => setPays(e.target.value)} placeholder="France" />
            </Field>
            <Field label="Années">
              <Input value={annees} onChange={(e) => setAnnees(e.target.value)} placeholder="1907" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Coefficient d'achat"
              error={errors.coefficient_achat}
              hint="Vide : coefficient général"
            >
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={coefficientAchat}
                onChange={(e) => setCoefficientAchat(e.target.value)}
                placeholder="0.85"
              />
            </Field>
            <Field
              label="Coefficient de vente"
              error={errors.coefficient_vente}
              hint="Vide : coefficient général"
            >
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={coefficientVente}
                onChange={(e) => setCoefficientVente(e.target.value)}
                placeholder="1.05"
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <FloppyDisk size={16} weight="duotone" />
            {saving ? "Création..." : "Créer et sélectionner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
