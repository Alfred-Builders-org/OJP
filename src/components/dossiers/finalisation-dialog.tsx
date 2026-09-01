"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Lot, LotReference } from "@/types/lot";

interface FinalisationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  processing: boolean;
  /** Lots au brouillon, ceux que la finalisation va engager. */
  lots: Lot[];
  lotReferences: LotReference[];
  /** Délai de rétractation en heures. Aligné sur `RETRACTATION_DELAY_MS`. */
  retractationHeures?: number;
}

/**
 * Confirmation de la finalisation d'un dossier.
 *
 * La finalisation était déclenchée d'un seul clic, sans retour. Or elle engage :
 * elle fige les prix, émet des documents, envoie des e-mails au client et ouvre
 * des délais légaux. Le récapitulatif dit ce qui va se produire, lot par lot,
 * avant que ce soit irréversible.
 */
export function FinalisationDialog({
  open,
  onOpenChange,
  onConfirm,
  processing,
  lots,
  lotReferences,
  retractationHeures = 48,
}: FinalisationDialogProps) {
  const resume = lots.map((lot) => {
    const refs = lotReferences.filter((r) => r.lot_id === lot.id);
    const devis = refs.filter((r) => r.type_rachat === "devis");
    const directs = refs.filter((r) => r.type_rachat !== "devis");
    const total = refs.reduce(
      (sum, r) => sum + (r.prix_achat ?? 0) * (r.quantite ?? 1),
      0
    );
    return { lot, refs, devis, directs, total };
  });

  const totalGeneral = resume.reduce((sum, r) => sum + r.total, 0);
  const aucuneReference = resume.some((r) => r.refs.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={20} weight="duotone" />
            Finaliser le dossier
          </DialogTitle>
          <DialogDescription>
            Voici ce que cette finalisation va produire. L&apos;opération n&apos;est pas
            réversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {resume.map(({ lot, refs, devis, directs, total }) => (
            <div key={lot.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{lot.numero}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(total)}
                </span>
              </div>

              {refs.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Warning size={14} weight="duotone" />
                  Aucune référence — ce lot sera finalisé à vide
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    {refs.length} référence{refs.length > 1 ? "s" : ""} au total
                  </li>
                  {directs.length > 0 && (
                    <li className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="font-normal">
                        {directs.length} en accord immédiat
                      </Badge>
                      <span>
                        contrat émis, délai de rétractation de {retractationHeures} h
                      </span>
                    </li>
                  )}
                  {devis.length > 0 && (
                    <li className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="font-normal">
                        {devis.length} sur devis
                      </Badge>
                      <span>devis émis et envoyé au client</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}

          {resume.length > 1 && (
            <div className="flex items-center justify-between border-t pt-3 text-sm font-medium">
              <span>Total du dossier</span>
              <span>{formatCurrency(totalGeneral)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={processing || aucuneReference}>
            <CheckCircle size={16} weight="duotone" />
            {processing ? "Traitement..." : "Confirmer la finalisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
