"use client";

import { useEffect, useState } from "react";
import { Camera, CheckCircle, Warning } from "@phosphor-icons/react";
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
import { getSettingClient } from "@/lib/settings-client";
import { createClient } from "@/lib/supabase/client";
import type { Lot, LotReference } from "@/types/lot";
import type { VenteLigne } from "@/types/vente";

interface FinalisationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  processing: boolean;
  /** Lots au brouillon, ceux que la finalisation va engager. */
  lots: Lot[];
  lotReferences: LotReference[];
  /** Lignes des lots de vente : une vente n'a pas de references. */
  venteLignes?: VenteLigne[];
  /** Délai de rétractation en heures. Aligné sur `RETRACTATION_DELAY_MS`. */
  retractationHeures?: number;
  /** Taux de commission du dépôt-vente, tel que paramétré. */
  commissionPct?: number;
}

const LIBELLE_TYPE: Record<string, string> = {
  rachat: "Rachat",
  vente: "Vente",
  depot_vente: "Dépôt-vente",
};

/** Ce qu'un lot engage, selon qu'on achete ou qu'on vende. */
interface ResumeLot {
  lot: Lot;
  vide: boolean;
  total: number;
  /** Une ligne de consequence : ce que la finalisation va produire. */
  lignes: { badge: string; texte: string }[];
  compte: string;
  /** Photo de prise en charge manquante : la finalisation sera refusee. */
  photoManquante: boolean;
}

/**
 * Confirmation de la finalisation d'un dossier.
 *
 * La finalisation était déclenchée d'un seul clic, sans retour. Or elle engage :
 * elle fige les prix, émet des documents, envoie des e-mails au client et ouvre
 * des délais légaux. Le récapitulatif dit ce qui va se produire, lot par lot,
 * avant que ce soit irréversible.
 *
 * Les trois natures de lot n'engagent pas la même chose et ne se comptent pas
 * au même endroit : le rachat et le dépôt-vente portent des `lot_references`,
 * la vente des `vente_lignes`. Ne lire que les premières faisait passer tout
 * dossier de vente pour vide, et bloquait sa finalisation.
 *
 * Un dossier peut mêler les trois. Chaque lot est donc résumé selon son propre
 * type, et un lot vide parmi d'autres ne bloque plus l'ensemble : seul un
 * dossier entièrement vide n'a rien à finaliser.
 */
export function FinalisationDialog({
  open,
  onOpenChange,
  onConfirm,
  processing,
  lots,
  lotReferences,
  venteLignes = [],
  retractationHeures: retractationProp,
  commissionPct: commissionProp,
}: FinalisationDialogProps) {
  // Un ecran d'engagement qui annonce un taux par defaut annonce un taux faux :
  // on lit les regles reellement appliquees.
  const [retractationHeures, setRetractationHeures] = useState(retractationProp ?? 48);
  const [commissionPct, setCommissionPct] = useState(commissionProp ?? 40);

  // Lots deja photographies. Releve a l'ouverture plutot que lu sur les lots
  // recus : le vendeur peut venir de prendre la photo sur la fiche du lot, et
  // l'ecran du dossier n'aurait pas encore ete rejoue cote serveur.
  const [lotsPhotographies, setLotsPhotographies] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!open) return;
    const aPhotographier = lots
      .filter((l) => l.type === "rachat" || l.type === "depot_vente")
      .map((l) => l.id);

    if (aPhotographier.length === 0) {
      setLotsPhotographies(new Set());
      return;
    }

    createClient()
      .from("lot_photos")
      .select("lot_id")
      .in("lot_id", aPhotographier)
      .is("reference_id", null)
      .then(({ data }) => {
        setLotsPhotographies(new Set((data ?? []).map((p) => p.lot_id as string)));
      });
    // `lots` est recree a chaque rendu du parent : on se cale sur son contenu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lots.map((l) => l.id).join("|")]);

  useEffect(() => {
    if (!open) return;
    getSettingClient("business_rules").then((rules) => {
      if (!rules) return;
      if (retractationProp == null && rules.retractation_heures) {
        setRetractationHeures(rules.retractation_heures);
      }
      if (commissionProp == null && rules.commission_dv_pct != null) {
        setCommissionPct(rules.commission_dv_pct);
      }
    });
  }, [open, retractationProp, commissionProp]);

  /**
   * Un rachat comme un depot-vente doit etre photographie avant d'etre engage.
   * Tant que le releve n'est pas revenu, on ne signale rien : annoncer un
   * manque puis le retirer une seconde plus tard vaut moins que d'attendre.
   */
  function photoManque(lot: Lot): boolean {
    if (lot.type !== "rachat" && lot.type !== "depot_vente") return false;
    if (lotsPhotographies === null) return false;
    return !lotsPhotographies.has(lot.id);
  }

  const resume: ResumeLot[] = lots.map((lot) => {
    if (lot.type === "depot_vente") {
      // Un depot-vente porte des references, comme un rachat, mais n'engage ni
      // paiement ni retractation : la marchandise reste au deposant jusqu'a la
      // vente, et c'est la commission qui se joue.
      const refs = lotReferences.filter((r) => r.lot_id === lot.id);
      const netDeposant = refs.reduce(
        (sum, r) => sum + (r.prix_achat ?? 0) * (r.quantite ?? 1),
        0
      );
      const prixAffiche = refs.reduce(
        (sum, r) => sum + (r.prix_revente_estime ?? 0) * (r.quantite ?? 1),
        0
      );

      const consequences: { badge: string; texte: string }[] = [];
      if (refs.length > 0) {
        consequences.push({
          badge: `${refs.length} article${refs.length > 1 ? "s" : ""} en dépôt`,
          texte: `contrat de dépôt-vente émis, commission de ${commissionPct} %`,
        });
        if (prixAffiche > 0) {
          consequences.push({
            badge: formatCurrency(prixAffiche),
            texte: "prix affiché en boutique",
          });
        }
      }

      return {
        lot,
        vide: refs.length === 0,
        total: netDeposant,
        lignes: consequences,
        compte: `${refs.length} article${refs.length > 1 ? "s" : ""} confié${refs.length > 1 ? "s" : ""} par le client`,
        photoManquante: photoManque(lot),
      };
    }

    if (lot.type === "vente") {
      const lignes = venteLignes.filter((l) => l.lot_id === lot.id);
      const total = lignes.reduce((sum, l) => sum + (l.prix_total ?? 0), 0);
      const taxe = lignes.reduce((sum, l) => sum + (l.montant_taxe ?? 0), 0);
      const aCommander = lignes.filter(
        (l) => l.fulfillment === "pending" || l.fulfillment === "a_commander"
      );

      const consequences: { badge: string; texte: string }[] = [];
      if (lignes.length > 0) {
        consequences.push({
          badge: `${lignes.length} article${lignes.length > 1 ? "s" : ""}`,
          texte: taxe > 0
            ? `facture émise, dont ${formatCurrency(taxe)} de taxe`
            : "facture émise et envoyée au client",
        });
      }
      if (aCommander.length > 0) {
        consequences.push({
          badge: `${aCommander.length} à commander`,
          texte: "partira en commande fonderie après la facture",
        });
      }

      return {
        lot,
        vide: lignes.length === 0,
        total,
        lignes: consequences,
        compte: `${lignes.length} ligne${lignes.length > 1 ? "s" : ""} de vente`,
        photoManquante: false,
      };
    }

    const refs = lotReferences.filter((r) => r.lot_id === lot.id);
    const devis = refs.filter((r) => r.type_rachat === "devis");
    const directs = refs.filter((r) => r.type_rachat !== "devis");
    const total = refs.reduce(
      (sum, r) => sum + (r.prix_achat ?? 0) * (r.quantite ?? 1),
      0
    );

    const consequences: { badge: string; texte: string }[] = [];
    if (directs.length > 0) {
      consequences.push({
        badge: `${directs.length} en accord immédiat`,
        texte: `contrat émis, délai de rétractation de ${retractationHeures} h`,
      });
    }
    if (devis.length > 0) {
      consequences.push({
        badge: `${devis.length} sur devis`,
        texte: "devis émis et envoyé au client",
      });
    }

    return {
      lot,
      vide: refs.length === 0,
      total,
      lignes: consequences,
      compte: `${refs.length} référence${refs.length > 1 ? "s" : ""} au total`,
      photoManquante: photoManque(lot),
    };
  });

  const totalGeneral = resume.reduce((sum, r) => sum + r.total, 0);
  const lotsVides = resume.filter((r) => r.vide);
  const toutVide = resume.length > 0 && lotsVides.length === resume.length;
  const sansPhoto = resume.filter((r) => r.photoManquante && !r.vide);

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
          {resume.map(({ lot, vide, total, lignes, compte, photoManquante }) => (
            <div key={lot.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium">{lot.numero}</span>
                  {/*
                    Un dossier melange rachat, vente et depot-vente : sans le
                    type, deux cartes voisines annoncent des consequences
                    opposees sans dire laquelle vaut pour quoi.
                  */}
                  <Badge variant="outline" className="font-normal shrink-0">
                    {LIBELLE_TYPE[lot.type] ?? lot.type}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {formatCurrency(total)}
                  {lot.type === "depot_vente" && total > 0 && (
                    <span className="ml-1 text-xs">net déposant</span>
                  )}
                </span>
              </div>

              {vide ? (
                <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Warning size={14} weight="duotone" />
                  {lot.type === "rachat"
                    ? "Aucune référence — ce lot sera finalisé à vide"
                    : "Aucun article — ce lot sera finalisé à vide"}
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>{compte}</li>
                  {photoManquante && (
                    <li className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <Camera size={14} weight="duotone" />
                      <span>Photo de la marchandise manquante</span>
                    </li>
                  )}
                  {lignes.map((c) => (
                    <li key={c.badge} className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="font-normal">
                        {c.badge}
                      </Badge>
                      <span>{c.texte}</span>
                    </li>
                  ))}
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

          {/*
            Un lot vide parmi d'autres ne bloque plus : on le signale, et la
            finalisation reste possible pour ceux qui portent quelque chose.
          */}
          {sansPhoto.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <Camera size={16} weight="duotone" className="mt-0.5 shrink-0" />
              <span>
                Photographiez la marchandise avant de finaliser. Passé ce point, le
                lot est engagé et plus personne ne pourra le photographier tel
                qu&apos;il a été remis. La photo se prend sur la fiche du lot
                {sansPhoto.length === 1 ? ` ${sansPhoto[0].lot.numero}` : ""}.
              </span>
            </div>
          )}

          {lotsVides.length > 0 && !toutVide && (
            <p className="text-xs text-muted-foreground">
              {lotsVides.length} lot{lotsVides.length > 1 ? "s" : ""} sera finalisé à
              vide. Les autres suivront leur cours.
            </p>
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
          <Button
            onClick={onConfirm}
            disabled={processing || toutVide || sansPhoto.length > 0}
          >
            <CheckCircle size={16} weight="duotone" />
            {processing ? "Traitement..." : "Confirmer la finalisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
