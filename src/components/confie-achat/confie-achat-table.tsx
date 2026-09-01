"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, Diamond, User, ArrowUUpLeft } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import type { BijouxStock } from "@/types/bijoux";
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
import { formatCurrency, formatDate } from "@/lib/format";

export interface ConfieAchatItem extends BijouxStock {
  deposant_name: string | null;
  deposant_client_id: string | null;
  lot_numero: string | null;
  lot_id: string | null;
  date_depot: string | null;
}

const statutConfig: Record<string, { label: string; className: string }> = {
  en_depot_vente: { label: "En dépôt", className: "bg-cyan-500/10 text-cyan-600 border-cyan-600/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-400/30" },
  vendu: { label: "Vendu", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/30" },
  rendu_client: { label: "Rendu client", className: "bg-gray-500/10 text-gray-600 border-gray-600/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-400/30" },
};

const STATUT_OPTIONS = Object.entries(statutConfig).map(([value, { label }]) => ({
  value,
  label,
}));

interface ConfieAchatTableProps {
  data: ConfieAchatItem[];
  canEdit?: boolean;
  totalItems: number;
}

export function ConfieAchatTable({ data, canEdit = true, totalItems }: ConfieAchatTableProps) {
  const router = useRouter();

  async function restituer(id: string) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("bijoux_stock").update({ statut: "rendu_client" }).eq("id", id),
      "Erreur lors de la restitution",
      "Article restitué au client"
    );
    if (error) return;
    router.refresh();
  }

  const colonnes: ColonneGrid<ConfieAchatItem>[] = [
    {
      cle: "nom",
      titre: "Nom",
      triable: true,
      cellule: (item) => (
        <div className="flex items-center gap-3">
          {item.photo_url ? (
            <Image
              src={item.photo_url}
              alt={item.nom}
              width={32}
              height={32}
              className="h-8 w-8 rounded object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
              <Diamond size={16} weight="duotone" className="text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{item.nom}</span>
        </div>
      ),
    },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (item) => {
        const statut = statutConfig[item.statut] ?? { label: item.statut, className: "" };
        return (
          <Badge variant="outline" className={statut.className}>
            {statut.label}
          </Badge>
        );
      },
      groupe: (item) => statutConfig[item.statut]?.label ?? item.statut,
    },
    {
      cle: "deposant",
      titre: "Déposant",
      cellule: (item) =>
        item.deposant_name ? (
          <span className="flex items-center gap-1.5">
            <User size={14} weight="duotone" className="text-muted-foreground" />
            <span className="text-sm">{item.deposant_name}</span>
          </span>
        ) : (
          "—"
        ),
      groupe: (item) => item.deposant_name ?? "Sans déposant",
    },
    {
      cle: "date_depot",
      titre: "Date de dépôt",
      triable: true,
      cellule: (item) => formatDate(item.date_depot),
    },
    {
      cle: "metal",
      titre: "Métal",
      triable: true,
      cellule: (item) => item.metaux ?? "—",
      groupe: (item) => item.metaux ?? "Sans métal",
    },
    {
      cle: "poids",
      titre: "Poids",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (item) =>
        item.poids_net !== null
          ? `${item.poids_net} g`
          : item.poids !== null
            ? `${item.poids} g`
            : "—",
    },
    {
      cle: "prix_achat",
      titre: "Prix déposant",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (item) => formatCurrency(item.prix_achat),
    },
    {
      cle: "prix_revente",
      titre: "Prix public",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (item) => formatCurrency(item.prix_revente),
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={data}
      totalItems={totalItems}
      cleLigne={(item) => item.id}
      onRowClick={(item) => router.push(`/confie-achat/${item.id}`)}
      placeholderRecherche="Rechercher un article confié..."
      messageVide="Aucun confié d'achat trouvé."
      filtres={[
        { cle: "statut", label: "Statut", options: STATUT_OPTIONS },
        { cle: "metal", label: "Métal", options: METAL_OPTIONS },
      ]}
      groupements={[
        { cle: "statut", label: "Statut" },
        { cle: "deposant", label: "Déposant" },
        { cle: "metal", label: "Métal" },
      ]}
      actions={(item) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
          >
            <DotsThree size={16} weight="regular" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/confie-achat/${item.id}`)}>
              <Eye size={16} weight="duotone" />
              Voir détail
            </DropdownMenuItem>
            {canEdit && item.statut === "en_depot_vente" && (
              <DropdownMenuItem onClick={() => restituer(item.id)}>
                <ArrowUUpLeft size={16} weight="duotone" />
                Restituer au client
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
