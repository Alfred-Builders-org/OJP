"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Receipt, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  construireCsv,
  telechargerCsv,
  nomFichierDate,
  nombreFr,
} from "@/lib/export-csv";
import type { TaxeRow } from "@/types/impots";
import { TaxeTypeBadge } from "@/components/impots/taxe-type-badge";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { useDataGridState } from "@/hooks/use-data-grid-state";
import { formatDate, formatCurrency } from "@/lib/format";

const TYPE_OPTIONS = [
  { value: "TMP", label: "TMP" },
  { value: "TPV", label: "TPV" },
  { value: "TFOP", label: "TFOP" },
  { value: "TVA", label: "TVA" },
] as const;

interface ImpotsTableProps {
  data: TaxeRow[];
}

/**
 * Registre des taxes.
 *
 * Contrairement aux autres listes, celle-ci n'est pas une table : c'est un
 * agrégat calculé côté serveur à partir des rachats et des ventes. Le filtrage
 * reste donc en mémoire — mais il porte bien sur l'ensemble du jeu, et non sur
 * la seule page affichée.
 */
export function ImpotsTable({ data }: ImpotsTableProps) {
  const router = useRouter();
  const grid = useDataGridState();

  const filtrees = useMemo(() => {
    let result = data;

    if (grid.search) {
      const q = grid.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.reference.toLowerCase().includes(q) ||
          r.client_name.toLowerCase().includes(q)
      );
    }

    const types = grid.filters.type;
    if (types?.length) {
      result = result.filter((r) => types.includes(r.type));
    }

    if (grid.sort) {
      const cle = grid.sort as keyof TaxeRow;
      const sens = grid.sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        const va = a[cle];
        const vb = b[cle];
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * sens;
        return String(va).localeCompare(String(vb), "fr") * sens;
      });
    }

    return result;
  }, [data, grid.search, grid.filters, grid.sort, grid.sortDir]);

  const page = filtrees.slice(
    grid.page * grid.pageSize,
    grid.page * grid.pageSize + grid.pageSize
  );

  /**
   * Export du registre des taxes.
   *
   * Porte sur l'ensemble des lignes retenues par la recherche et les filtres, et
   * non sur la page affichee : c'est un document qu'on remet a un comptable, ou
   * dont on recopie les totaux sur le formulaire 2091. Une version tronquee a la
   * page consultee serait fausse sans le dire.
   */
  function exporter() {
    const contenu = construireCsv(filtrees, [
      { entete: "Date", valeur: (t: TaxeRow) => formatDate(t.date) },
      { entete: "Référence", valeur: (t: TaxeRow) => t.reference },
      { entete: "Client", valeur: (t: TaxeRow) => t.client_name },
      { entete: "Type de taxe", valeur: (t: TaxeRow) => t.type },
      { entete: "Origine", valeur: (t: TaxeRow) => (t.source_type === "rachat" ? "Rachat" : "Vente") },
      { entete: "Montant brut (€)", valeur: (t: TaxeRow) => nombreFr(t.montant_brut) },
      { entete: "Taxe (€)", valeur: (t: TaxeRow) => nombreFr(t.montant_taxe) },
    ]);
    telechargerCsv(contenu, nomFichierDate("registre-des-taxes"));
  }

  // Totaux par type : ce sont eux qu'on reporte sur une declaration.
  const totauxParType = filtrees.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] ?? 0) + t.montant_taxe;
    return acc;
  }, {});

  const colonnes: ColonneGrid<TaxeRow>[] = [
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Receipt size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span>{formatDate(t.date)}</span>
        </div>
      ),
    },
    { cle: "reference", titre: "Référence", triable: true, className: "font-medium", cellule: (t) => t.reference },
    {
      cle: "client_name",
      titre: "Client",
      triable: true,
      cellule: (t) => t.client_name,
      groupe: (t) => t.client_name,
    },
    {
      cle: "type",
      titre: "Type",
      triable: true,
      cellule: (t) => <TaxeTypeBadge type={t.type} />,
      groupe: (t) => t.type,
    },
    { cle: "montant_brut", titre: "Montant brut", triable: true, cellule: (t) => formatCurrency(t.montant_brut) },
    {
      cle: "montant_taxe",
      titre: "Taxe",
      triable: true,
      className: "font-medium",
      cellule: (t) => formatCurrency(t.montant_taxe),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(totauxParType).map(([type, montant]) => (
            <Badge key={type} variant="outline" className="font-normal tabular-nums">
              {type} : {formatCurrency(montant)}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exporter}
          disabled={filtrees.length === 0}
        >
          <DownloadSimple size={16} weight="duotone" />
          Exporter ({filtrees.length})
        </Button>
      </div>

      <DataGrid
        colonnes={colonnes}
        donnees={page}
      totalItems={filtrees.length}
      cleLigne={(t) => t.id}
      onRowClick={(t) =>
        router.push(
          t.source_type === "rachat" ? `/lots/${t.source_id}` : `/ventes/${t.source_id}`
        )
      }
      placeholderRecherche="Rechercher une taxe..."
      messageVide="Aucune taxe trouvée."
      filtres={[{ cle: "type", label: "Type", options: TYPE_OPTIONS }]}
        groupements={[
          { cle: "type", label: "Type de taxe" },
          { cle: "client_name", label: "Client" },
        ]}
      />
    </>
  );
}
