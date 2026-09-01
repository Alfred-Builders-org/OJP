"use client";

import { useRouter } from "next/navigation";
import { DotsThree, Eye, Coins } from "@phosphor-icons/react";
import type { OrInvestissement } from "@/types/or-investissement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { METAL_OPTIONS } from "@/lib/validations/lot";

interface OrInvestissementTableProps {
  data: OrInvestissement[];
  canEdit: boolean;
  totalItems: number;
}

export function OrInvestissementTable({ data, totalItems }: OrInvestissementTableProps) {
  const router = useRouter();

  const colonnes: ColonneGrid<OrInvestissement>[] = [
    {
      cle: "designation",
      titre: "Désignation",
      triable: true,
      cellule: (o) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Coins size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span className="font-medium">{o.designation}</span>
        </div>
      ),
    },
    { cle: "pays", titre: "Pays", triable: true, cellule: (o) => o.pays ?? "—", groupe: (o) => o.pays ?? "Sans pays" },
    { cle: "annees", titre: "Années", triable: true, cellule: (o) => o.annees ?? "—" },
    {
      cle: "metal",
      titre: "Métal",
      triable: true,
      cellule: (o) => o.metal ?? "—",
      groupe: (o) => o.metal ?? "Sans métal",
    },
    { cle: "titre", titre: "Titre", triable: true, cellule: (o) => o.titre ?? "—" },
    {
      cle: "coefficients",
      titre: "Coefficients",
      headClassName: "text-right",
      className: "text-right tabular-nums",
      // « Général » dit que la piece suit les coefficients des parametres — a
      // distinguer d'une valeur propre, qui est une decision commerciale.
      cellule: (o) =>
        o.coefficient_achat == null && o.coefficient_vente == null ? (
          <span className="text-xs text-muted-foreground">Général</span>
        ) : (
          <span className="text-xs">
            A {o.coefficient_achat ?? "—"} · V {o.coefficient_vente ?? "—"}
          </span>
        ),
    },
    {
      cle: "poids",
      titre: "Poids",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (o) => (o.poids !== null ? `${o.poids} g` : "—"),
    },
    {
      cle: "quantite",
      titre: "Quantité",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (o) => <Badge variant="outline">{o.quantite}</Badge>,
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={data}
      totalItems={totalItems}
      cleLigne={(o) => o.id}
      onRowClick={(o) => router.push(`/or-investissement/${o.id}`)}
      placeholderRecherche="Rechercher une pièce..."
      messageVide="Aucune pièce trouvée."
      filtres={[{ cle: "metal", label: "Métal", options: METAL_OPTIONS }]}
      groupements={[
        { cle: "metal", label: "Métal" },
        { cle: "pays", label: "Pays" },
      ]}
      actions={(item) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
          >
            <DotsThree size={16} weight="regular" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/or-investissement/${item.id}`)}>
              <Eye size={16} weight="duotone" />
              Voir détail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
