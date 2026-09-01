"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePreviewDrawer } from "@/hooks/use-preview-drawer";
import {
  Plus,
  ShoppingCart,
  Storefront,
  HandCoins,
  DotsThree,
  Eye,
  Trash,
  WarningCircle,
  Package,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
import { ReferenceCard } from "@/components/lots/reference-card";
import { VenteLigneCard } from "@/components/ventes/vente-ligne-card";
import { VenteStatusBadge } from "@/components/ventes/vente-status-badge";
import { formatDate, formatCurrency } from "@/lib/format";
import type { Lot, LotStatus, LotReference } from "@/types/lot";
import type { VenteLigne } from "@/types/vente";
import type { DossierStatus } from "@/types/dossier";

export type RefActionId =
  | "ref.valider_rachat"
  | "ref.retracter"
  | "ref.accepter_devis"
  | "ref.refuser_devis"
  | "ref.restituer";

interface DossierLotsSectionProps {
  lots: Lot[];
  dossierStatus: DossierStatus;
  creatingLot: boolean;
  onCreateLot: (type: "rachat" | "vente" | "depot_vente") => void;
  onDeleteLot: (lotId: string) => void;
  /** Toutes les references du dossier, tous lots confondus. */
  lotReferences?: LotReference[];
  /** Lignes des lots de vente : une vente ne porte pas de references. */
  venteLignes?: VenteLigne[];
  /** Nom de la fonderie par bon de commande, pour les lignes deja commandees. */
  fonderieParBdc?: Record<string, string>;
  /** Rejoue une action de reference depuis le dossier, sans ouvrir le lot. */
  onRefAction?: (actionId: RefActionId, refId: string, lot: Lot) => void;
}

export function DossierLotsSection({
  lots,
  dossierStatus,
  creatingLot,
  onCreateLot,
  onDeleteLot,
  lotReferences = [],
  venteLignes = [],
  fonderieParBdc = {},
  onRefAction,
}: DossierLotsSectionProps) {
  const router = useRouter();
  const { openPreview } = usePreviewDrawer();
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);

  /**
   * Le tiroir ne sait rendre qu'un lot de rachat ou de depot-vente : l'apercu
   * des ventes n'est pas encore ecrit. Plutot que d'ouvrir un panneau vide, une
   * vente ouvre directement sa page.
   */
  function ouvrirLot(lot: Lot) {
    if (lot.type === "vente") {
      router.push(getLotUrl(lot));
      return;
    }
    openPreview("lot", lot.id);
  }

  function getLotUrl(lot: Lot): string {
    if (lot.type === "vente") return `/ventes/${lot.id}`;
    if (lot.type === "depot_vente") return `/depot-vente/${lot.id}`;
    return `/lots/${lot.id}`;
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package size={20} weight="duotone" />
          Lots ({lots.length})
        </CardTitle>
        {dossierStatus === "brouillon" && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="sm" variant="secondary" disabled={creatingLot}>
                  <Plus size={14} weight="bold" />
                  {creatingLot ? "Création..." : "Nouveau lot"}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCreateLot("rachat")}>
                <ShoppingCart size={16} weight="duotone" />
                Rachat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateLot("vente")}>
                <Storefront size={16} weight="duotone" />
                Vente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateLot("depot_vente")}>
                <HandCoins size={16} weight="duotone" />
                Dépôt-vente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {lots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucun lot pour ce dossier.
          </p>
        ) : (
          <div className="space-y-2">
            {lots.map((lot) => {
              // Une fois le lot engage, ses references portent chacune une
              // action a mener — valider un rachat, honorer une retractation,
              // repondre a un devis. Les tenir cachees derriere l'ouverture du
              // lot obligeait a entrer dans chaque lot pour savoir s'il
              // attendait quelque chose.
              const engage = lot.status !== "brouillon";
              const refsDuLot = engage
                ? lotReferences.filter((r) => r.lot_id === lot.id)
                : [];
              const lignesDuLot = engage
                ? venteLignes.filter((v) => v.lot_id === lot.id)
                : [];
              const isDepotVente = lot.type === "depot_vente";

              return (
            <div key={lot.id} className="space-y-2">
              <div
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  // Consulter un lot depuis son dossier ouvre un tiroir plutot
                  // que de quitter la page : on suit l'avancement du lot sans
                  // perdre le contexte du dossier, et sans navigation aller-retour.
                  onClick={() => ouvrirLot(lot)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                    {lot.type === "vente" ? (
                      <Storefront size={16} weight="duotone" className="text-muted-foreground" />
                    ) : lot.type === "depot_vente" ? (
                      <HandCoins size={16} weight="duotone" className="text-muted-foreground" />
                    ) : (
                      <ShoppingCart size={16} weight="duotone" className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{lot.numero}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {lot.type === "vente" ? "Vente" : lot.type === "depot_vente" ? "Dépôt-vente" : "Rachat"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(lot.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(lot.type === "vente" ? lot.total_prix_revente : lot.total_prix_achat)}
                    </span>
                    {lot.type === "depot_vente" && (
                      <p className="text-xs text-muted-foreground">{formatCurrency(lot.total_prix_revente)} prix public</p>
                    )}
                  </div>
                  <LotStatusBadge status={lot.status as LotStatus} outcome={lot.outcome} />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-xs" />}
                      aria-label="Actions"
                    >
                      <DotsThree size={16} weight="regular" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => ouvrirLot(lot)}>
                        <Eye size={14} weight="duotone" />
                        Aperçu rapide
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(getLotUrl(lot))}>
                        <ArrowSquareOut size={14} weight="duotone" />
                        Ouvrir le lot
                      </DropdownMenuItem>
                      {dossierStatus === "brouillon" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingLotId(lot.id)}
                          >
                            <Trash size={14} weight="duotone" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/*
                Une vente ne porte pas de references : ses articles sont des
                lignes de vente. Sans elles, un dossier de vente n'affichait que
                le numero de son lot, et il fallait ouvrir la vente pour savoir
                ce qu'elle contenait ou ce qu'il restait a commander.
              */}
              {lignesDuLot.length > 0 && (
                <div className="ml-4 space-y-2 border-l pl-4">
                  {lignesDuLot.map((ligne) => (
                    <VenteLigneCard
                      key={ligne.id}
                      ligne={ligne}
                      showFulfillment
                      showLivraison={lot.status === "finalise"}
                      onLivraisonChange={() => router.refresh()}
                      fonderieName={
                        ligne.bon_commande_id
                          ? fonderieParBdc[ligne.bon_commande_id]
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {refsDuLot.length > 0 && (
                <div className="ml-4 space-y-2 border-l pl-4">
                  {refsDuLot.map((reference) => (
                    <ReferenceCard
                      key={reference.id}
                      reference={reference}
                      hideTypeRachat={isDepotVente}
                      isDepotVente={isDepotVente}
                      canRestituer={isDepotVente && !!onRefAction}
                      onValiderRachat={
                        onRefAction
                          ? (id) => onRefAction("ref.valider_rachat", id, lot)
                          : undefined
                      }
                      onRetracter={
                        onRefAction
                          ? (id) => onRefAction("ref.retracter", id, lot)
                          : undefined
                      }
                      onAccepterDevis={
                        onRefAction
                          ? (id) => onRefAction("ref.accepter_devis", id, lot)
                          : undefined
                      }
                      onRefuserDevis={
                        onRefAction
                          ? (id) => onRefAction("ref.refuser_devis", id, lot)
                          : undefined
                      }
                      onRestituer={
                        onRefAction
                          ? (id) => onRefAction("ref.restituer", id, lot)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
              );
            })}

            {/* Dialog de confirmation suppression lot */}
            <Dialog open={!!deletingLotId} onOpenChange={(open) => { if (!open) setDeletingLotId(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <WarningCircle size={20} weight="duotone" className="text-destructive" />
                    Supprimer le lot
                  </DialogTitle>
                  <DialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce lot et toutes ses références ? Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDeletingLotId(null)}>
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (deletingLotId) {
                        onDeleteLot(deletingLotId);
                        setDeletingLotId(null);
                      }
                    }}
                  >
                    <Trash size={14} weight="duotone" />
                    Supprimer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
