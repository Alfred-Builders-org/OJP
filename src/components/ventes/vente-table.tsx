"use client";

import { useRouter } from "next/navigation";
import { DotsThree, Eye, Storefront } from "@phosphor-icons/react";
import type { LotWithDossier, LotStatus } from "@/types/lot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { VenteStatusBadge } from "@/components/ventes/vente-status-badge";
import { VENTE_STATUS_OPTIONS } from "@/lib/validations/vente";
import { formatCurrency, formatDate } from "@/lib/format";

interface VenteTableProps {
  data: LotWithDossier[];
  totalItems: number;
}

export function VenteTable({ data, totalItems }: VenteTableProps) {
  const router = useRouter();

  const colonnes: ColonneGrid<LotWithDossier>[] = [
    {
      cle: "numero",
      titre: "Numéro",
      triable: true,
      cellule: (v) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Storefront size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span className="font-medium">{v.numero}</span>
        </div>
      ),
    },
    {
      cle: "client",
      titre: "Client",
      cellule: (v) =>
        `${v.dossier.client.civility === "M" ? "M." : "Mme"} ${v.dossier.client.first_name} ${v.dossier.client.last_name}`,
    },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (v) => <VenteStatusBadge status={v.status as LotStatus} />,
      groupe: (v) =>
        VENTE_STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status,
    },
    {
      cle: "prix_vente",
      titre: "Prix de vente",
      triable: true,
      className: "font-medium",
      cellule: (v) => formatCurrency(v.total_prix_revente),
    },
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (v) => formatDate(v.created_at),
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={data}
      totalItems={totalItems}
      cleLigne={(v) => v.id}
      onRowClick={(v) => router.push(`/ventes/${v.id}`)}
      placeholderRecherche="Rechercher une vente..."
      messageVide="Aucune vente trouvée."
      filtres={[{ cle: "statut", label: "Statut", options: VENTE_STATUS_OPTIONS }]}
      groupements={[{ cle: "statut", label: "Statut" }]}
      actions={(item) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
          >
            <DotsThree size={16} weight="regular" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/ventes/${item.id}`)}>
              <Eye size={16} weight="duotone" />
              Voir détail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
