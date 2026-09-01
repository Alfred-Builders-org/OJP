"use client";

import { useRouter } from "next/navigation";
import { DotsThree, Eye, Package } from "@phosphor-icons/react";
import type { LotWithDossier, LotStatus } from "@/types/lot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
import { LOT_STATUS_OPTIONS } from "@/lib/validations/lot";
import { formatCurrency, formatDate } from "@/lib/format";

interface LotTableProps {
  data: LotWithDossier[];
  basePath?: string;
  lotType?: "rachat" | "depot_vente";
  totalItems: number;
}

export function LotTable({
  data,
  basePath = "/lots",
  lotType = "rachat",
  totalItems,
}: LotTableProps) {
  const router = useRouter();

  const nomClient = (lot: LotWithDossier) =>
    `${lot.dossier.client.civility === "M" ? "M." : "Mme"} ${lot.dossier.client.first_name} ${lot.dossier.client.last_name}`;

  const colonnes: ColonneGrid<LotWithDossier>[] = [
    {
      cle: "numero",
      titre: "Numéro",
      triable: true,
      cellule: (l) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Package size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span className="font-medium">{l.numero}</span>
        </div>
      ),
    },
    { cle: "client", titre: "Client", cellule: nomClient },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (l) => (
        <LotStatusBadge status={l.status as LotStatus} outcome={l.outcome} />
      ),
      groupe: (l) =>
        LOT_STATUS_OPTIONS.find((o) => o.value === l.status)?.label ?? l.status,
    },
    {
      cle: "prix",
      titre: lotType === "depot_vente" ? "Prix de revente" : "Prix de rachat",
      triable: true,
      className: "font-medium",
      cellule: (l) =>
        formatCurrency(
          lotType === "depot_vente" ? l.total_prix_revente : l.total_prix_achat
        ),
    },
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (l) => formatDate(l.created_at),
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={data}
      totalItems={totalItems}
      cleLigne={(l) => l.id}
      onRowClick={(l) => router.push(`${basePath}/${l.id}`)}
      placeholderRecherche="Rechercher un lot..."
      messageVide="Aucun lot trouvé."
      filtres={[{ cle: "statut", label: "Statut", options: LOT_STATUS_OPTIONS }]}
      groupements={[{ cle: "statut", label: "Statut" }]}
      actions={(item) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
          >
            <DotsThree size={16} weight="regular" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${item.id}`)}>
              <Eye size={16} weight="duotone" />
              Voir détail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
