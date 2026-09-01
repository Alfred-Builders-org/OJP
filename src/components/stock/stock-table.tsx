"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, Diamond, Factory, Package, Trash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import type { BijouxStockWithOrigin } from "@/types/bijoux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { METAL_STOCK_OPTIONS } from "@/lib/validations/lot";
import { formatCurrency } from "@/lib/format";

const statutConfig: Record<
  BijouxStockWithOrigin["statut"],
  { label: string; className: string }
> = {
  en_stock: { label: "En stock", className: "bg-blue-500/10 text-blue-600 border-blue-600/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-400/30" },
  vendu: { label: "Vendu", className: "bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20" },
  reserve: { label: "Réservé", className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-400/30" },
  en_depot_vente: { label: "En dépôt", className: "bg-cyan-500/10 text-cyan-600 border-cyan-600/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-400/30" },
  rendu_client: { label: "Rendu client", className: "bg-gray-500/10 text-gray-600 border-gray-600/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-400/30" },
  en_reparation: { label: "En réparation", className: "bg-orange-500/10 text-orange-600 border-orange-600/30 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-400/30" },
  fondu: { label: "Fondu", className: "bg-purple-500/10 text-purple-600 border-purple-600/30 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-400/30" },
  a_fondre: { label: "À fondre", className: "bg-violet-500/10 text-violet-600 border-violet-600/30 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-400/30" },
};

export const STOCK_STATUT_OPTIONS = Object.entries(statutConfig).map(
  ([value, { label }]) => ({ value, label })
);

interface StockTableProps {
  data: BijouxStockWithOrigin[];
  canEdit?: boolean;
  totalItems: number;
  basePath?: string;
}

export function StockTable({
  data,
  canEdit = true,
  totalItems,
  basePath = "/stock",
}: StockTableProps) {
  const router = useRouter();

  async function changerStatut(
    id: string,
    statut: "a_fondre" | "en_stock",
    messageErreur: string,
    messageSucces: string
  ) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("bijoux_stock").update({ statut }).eq("id", id),
      messageErreur,
      messageSucces
    );
    if (error) return;
    router.refresh();
  }

  const colonnes: ColonneGrid<BijouxStockWithOrigin>[] = [
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
        const statut = statutConfig[item.statut];
        return (
          <Badge variant="outline" className={statut?.className}>
            {statut?.label ?? item.statut}
          </Badge>
        );
      },
      groupe: (item) => statutConfig[item.statut]?.label ?? item.statut,
    },
    {
      cle: "origine",
      titre: "Origine",
      cellule: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.origin_client_name ?? "—"}
        </span>
      ),
    },
    {
      cle: "metal",
      titre: "Métal",
      triable: true,
      cellule: (item) => item.metaux ?? "—",
      groupe: (item) => item.metaux ?? "Sans métal",
    },
    { cle: "qualite", titre: "Qualité", triable: true, cellule: (item) => item.qualite ?? "—" },
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
      titre: "Prix d'achat",
      triable: true,
      headClassName: "text-right",
      className: "text-right",
      cellule: (item) => formatCurrency(item.prix_achat),
    },
    {
      cle: "prix_revente",
      titre: "Prix de revente",
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
      onRowClick={(item) => router.push(`${basePath}/${item.id}`)}
      placeholderRecherche="Rechercher un article..."
      messageVide="Aucun produit trouvé."
      filtres={[
        { cle: "statut", label: "Statut", options: STOCK_STATUT_OPTIONS },
        { cle: "metal", label: "Métal", options: METAL_STOCK_OPTIONS },
      ]}
      groupements={[
        { cle: "statut", label: "Statut" },
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
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${item.id}`)}>
              <Eye size={16} weight="duotone" />
              Voir détail
            </DropdownMenuItem>
            {item.statut === "en_stock" && (
              <DropdownMenuItem
                onClick={() =>
                  changerStatut(
                    item.id,
                    "a_fondre",
                    "Erreur lors de l'envoi en fonderie",
                    "Article destiné à la fonderie"
                  )
                }
              >
                <Factory size={16} weight="duotone" />
                Envoyer en fonderie
              </DropdownMenuItem>
            )}
            {item.statut === "a_fondre" && (
              <DropdownMenuItem
                onClick={() =>
                  changerStatut(
                    item.id,
                    "en_stock",
                    "Erreur lors du passage en stock",
                    "Article remis en stock"
                  )
                }
              >
                <Package size={16} weight="duotone" />
                Remettre en stock
              </DropdownMenuItem>
            )}
            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled>
                  <Trash size={16} weight="duotone" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
