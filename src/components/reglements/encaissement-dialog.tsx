"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bank, CheckSquare, CreditCard, Money } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
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
} from "@/components/ui/select";
import type { ModeReglement, ReglementSens, ReglementType } from "@/types/reglement";

const MODES: { value: ModeReglement; label: string; icon: typeof Money }[] = [
  { value: "especes", label: "Espèces", icon: Money },
  { value: "carte", label: "Carte bancaire", icon: CreditCard },
  { value: "virement", label: "Virement", icon: Bank },
  { value: "cheque", label: "Chèque", icon: CheckSquare },
];

interface EncaissementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titre: string;
  description?: string;
  type: Extract<ReglementType, "reparation" | "achat_grossiste">;
  sens: ReglementSens;
  /** Rattachement du mouvement : l'un ou l'autre, jamais les deux. */
  reparationId?: string;
  achatGrossisteId?: string;
  clientId?: string | null;
  /** Montant propose a l'ouverture, quand il est connu d'avance. */
  montantSuggere?: number | null;
  onEnregistre?: () => void;
}

/**
 * Encaisser ou decaisser hors operation.
 *
 * Le dialogue des paiements dus (`reglement-dialog`) est bati autour d'un lot :
 * il calcule un reste du a partir d'un engagement pris ailleurs, propose un
 * montant et refuse ce qui a deja ete paye. Une reparation et un achat
 * fournisseur n'ont rien de tout cela — un montant, un moyen de paiement, une
 * date, et c'est encaisse. D'ou un ecran court plutot qu'un parametre de plus
 * dans un composant qui en compte deja beaucoup.
 */
export function EncaissementDialog({
  open,
  onOpenChange,
  titre,
  description,
  type,
  sens,
  reparationId,
  achatGrossisteId,
  clientId,
  montantSuggere,
  onEnregistre,
}: EncaissementDialogProps) {
  const router = useRouter();
  const [montant, setMontant] = useState(
    montantSuggere ? String(montantSuggere) : ""
  );
  const [mode, setMode] = useState<ModeReglement | "">("");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("sv-SE"));
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer() {
    setErreur("");
    const valeur = parseFloat(montant.replace(",", "."));

    if (!Number.isFinite(valeur) || valeur === 0) {
      setErreur("Indiquez un montant.");
      return;
    }
    if (!mode) {
      setErreur("Indiquez un moyen de paiement.");
      return;
    }

    setEnregistrement(true);
    const supabase = createClient();

    const { error } = await mutate(
      supabase.from("reglements").insert({
        lot_id: null,
        reparation_id: reparationId ?? null,
        achat_grossiste_id: achatGrossisteId ?? null,
        client_id: clientId ?? null,
        sens,
        type,
        montant: valeur,
        mode,
        // La date porte l'heure du moment : la feuille de caisse classe les
        // mouvements dans l'ordre ou ils se sont produits.
        date_reglement: new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
      }),
      "Le règlement n'a pas pu être enregistré",
      "Règlement enregistré"
    );

    setEnregistrement(false);
    if (error) {
      setErreur(error);
      return;
    }

    onOpenChange(false);
    setMontant("");
    setMode("");
    onEnregistre?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant_encaissement" required>Montant</Label>
              <div className="relative">
                <Input
                  id="montant_encaissement"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  className="pr-7"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_encaissement">Date</Label>
              <Input
                id="date_encaissement"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode_encaissement" required>Moyen de paiement</Label>
            <Select value={mode} onValueChange={(v) => setMode((v ?? "") as ModeReglement)}>
              <SelectTrigger id="mode_encaissement">
                {mode ? (
                  (() => {
                    const opt = MODES.find((m) => m.value === mode)!;
                    const Icon = opt.icon;
                    return (
                      <span className="flex items-center gap-1.5">
                        <Icon size={14} weight="duotone" />
                        {opt.label}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">Choisir</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-1.5">
                        <Icon size={14} weight="duotone" />
                        {m.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <FieldError>{erreur}</FieldError>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={enregistrer} disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
