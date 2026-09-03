"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Buildings,
  Factory,
  Package,
  Plus,
  CheckCircle,
  Coins,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { ReferenceCard } from "@/components/lots/reference-card";
import { ReferenceFormBijoux } from "@/components/lots/reference-form-bijoux";
import { ReferenceFormOrInvest } from "@/components/lots/reference-form-or-invest";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
import { finaliserRachatFournisseur } from "@/lib/actions/fournisseur-actions";
import { formatCurrency } from "@/lib/format";
import type { LotWithReferences, LotReference } from "@/types/lot";
import type { OrInvestissement } from "@/types/or-investissement";

interface TiersDossier {
  id: string;
  numero: string;
  tiers_type: "grossiste" | "fonderie";
  grossiste?: { id: string; nom: string; raison_sociale: string | null } | null;
  fonderie?: { id: string; nom: string } | null;
}

interface FournisseurLotDetailPageProps {
  lot: LotWithReferences & { dossier: TiersDossier };
  orInvestCatalog: OrInvestissement[];
}

export function FournisseurLotDetailPage({
  lot,
  orInvestCatalog,
}: FournisseurLotDetailPageProps) {
  const router = useRouter();
  const [showBijoux, setShowBijoux] = useState(false);
  const [showOrInvest, setShowOrInvest] = useState(false);
  const [finalisation, setFinalisation] = useState(false);

  const estGrossiste = lot.dossier.tiers_type === "grossiste";
  const tiersNom = estGrossiste
    ? lot.dossier.grossiste?.raison_sociale ?? lot.dossier.grossiste?.nom ?? "Grossiste"
    : lot.dossier.fonderie?.nom ?? "Fonderie";

  const isBrouillon = lot.status === "brouillon";
  const references = lot.references ?? [];
  const total = references.reduce((s, r) => s + (r.prix_achat ?? 0), 0);

  async function supprimerReference(refId: string) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("lot_references").delete().eq("id", refId),
      "La référence n'a pas pu être supprimée",
    );
    if (!error) router.refresh();
  }

  async function finaliser() {
    setFinalisation(true);
    const resultat = await finaliserRachatFournisseur(lot.id);
    setFinalisation(false);
    if (resultat.error) {
      toast.error(resultat.error);
      return;
    }
    toast.success("Achat finalisé, articles entrés en stock");
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
        {isBrouillon && references.length > 0 && (
          <Button size="sm" onClick={finaliser} disabled={finalisation}>
            <CheckCircle size={16} weight="duotone" />
            {finalisation ? "Finalisation..." : "Finaliser l'achat"}
          </Button>
        )}
      </Header>

      <div className="flex-1 overflow-y-auto min-w-0 px-6 pt-6 pb-8 space-y-6">
        {/* Le tiers : un fournisseur, pas un particulier. Ni pièce, ni délai. */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {estGrossiste ? <Buildings size={20} weight="duotone" /> : <Factory size={20} weight="duotone" />}
              {tiersNom}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {estGrossiste ? "Grossiste" : "Fonderie"}
              </Badge>
              <LotStatusBadge status={lot.status} outcome={lot.outcome} />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Rachat à un professionnel — inscrit au livre de police, sans pièce
            d&apos;identité. Dossier {lot.dossier.numero}.
          </CardContent>
        </Card>

        {/* Références */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package size={20} weight="duotone" />
              Références ({references.length})
            </CardTitle>
            {isBrouillon && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="secondary" size="sm">
                      <Plus size={14} weight="bold" />
                      Référence
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setShowBijoux(true); setShowOrInvest(false); }}>
                    <Package size={14} weight="duotone" />
                    Bijou
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setShowOrInvest(true); setShowBijoux(false); }}>
                    <Coins size={14} weight="duotone" />
                    Or d&apos;investissement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {showBijoux && (
              <ReferenceFormBijoux
                lotId={lot.id}
                coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                coefficientSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                onClose={() => { setShowBijoux(false); router.refresh(); }}
              />
            )}
            {showOrInvest && (
              <ReferenceFormOrInvest
                lotId={lot.id}
                coursOrSnapshot={lot.cours_or_snapshot ?? 0}
                coursArgentSnapshot={lot.cours_argent_snapshot ?? 0}
                coursPlatineSnapshot={lot.cours_platine_snapshot ?? 0}
                coefficientRachatSnapshot={lot.coefficient_rachat_snapshot ?? 0}
                coefficientVenteSnapshot={lot.coefficient_vente_snapshot ?? 0}
                catalog={orInvestCatalog}
                onClose={() => { setShowOrInvest(false); router.refresh(); }}
              />
            )}

            {references.length === 0 && !showBijoux && !showOrInvest ? (
              <p className="text-sm text-muted-foreground">Aucune référence. Ajoutez ce que vous rachetez.</p>
            ) : (
              references.map((ref: LotReference) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  canEdit={isBrouillon}
                  onDelete={isBrouillon ? supprimerReference : undefined}
                />
              ))
            )}

            {references.length > 0 && (
              <div className="flex justify-end border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total rachat&nbsp;:&nbsp;</span>
                <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
