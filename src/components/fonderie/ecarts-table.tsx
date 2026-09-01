"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { formatDate, formatCurrency } from "@/lib/format";
import type { EcartRow } from "@/types/fonderie-lot";

interface EcartsTableProps {
  data: EcartRow[];
  totalItems: number;
}

/** Ce qui separe le declare du constate, en une valeur lisible. */
function Delta({
  declare,
  reel,
  unite = "",
}: {
  declare: string | number | null;
  reel: string | number | null;
  unite?: string;
}) {
  if (reel == null || reel === "") return <span className="text-muted-foreground">—</span>;
  const identique = String(declare ?? "") === String(reel);
  return (
    <span className="tabular-nums">
      <span className="text-muted-foreground">{declare ?? "—"}{unite}</span>
      <span className="mx-1 text-muted-foreground">→</span>
      <span className={identique ? "" : "font-medium text-amber-600 dark:text-amber-400"}>
        {reel}{unite}
      </span>
    </span>
  );
}

export function EcartsTable({ data, totalItems }: EcartsTableProps) {
  const router = useRouter();

  const colonnes: ColonneGrid<EcartRow>[] = [
    {
      cle: "designation",
      titre: "Article",
      className: "font-medium",
      cellule: (r) => r.designation,
    },
    {
      cle: "bdl_numero",
      titre: "Envoi",
      triable: true,
      className: "text-muted-foreground",
      cellule: (r) => r.bdl_numero,
    },
    {
      cle: "fonderie_nom",
      titre: "Fonderie",
      className: "text-muted-foreground",
      cellule: (r) => r.fonderie_nom,
      groupe: (r) => r.fonderie_nom,
    },
    {
      cle: "titrage",
      titre: "Titrage",
      cellule: (r) => <Delta declare={r.titrage_declare} reel={r.titrage_reel} />,
    },
    {
      cle: "poids",
      titre: "Poids",
      cellule: (r) => <Delta declare={r.poids_declare} reel={r.poids_reel} unite=" g" />,
    },
    {
      cle: "valeur_estimee",
      titre: "Estimé",
      headClassName: "text-right",
      className: "text-right text-muted-foreground tabular-nums",
      cellule: (r) => (r.valeur_estimee != null ? formatCurrency(r.valeur_estimee) : "—"),
    },
    {
      cle: "valeur_reelle",
      titre: "Réel",
      headClassName: "text-right",
      className: "text-right tabular-nums",
      cellule: (r) => (r.valeur_reelle != null ? formatCurrency(r.valeur_reelle) : "—"),
    },
    {
      cle: "ecart_valeur",
      titre: "Écart",
      triable: true,
      headClassName: "text-right",
      className: "text-right tabular-nums font-medium",
      cellule: (r) =>
        r.ecart_valeur == null ? (
          "—"
        ) : (
          <span className={r.ecart_valeur >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
            {r.ecart_valeur > 0 ? "+" : ""}
            {formatCurrency(r.ecart_valeur)}
          </span>
        ),
    },
    {
      cle: "motif",
      titre: "Motif",
      cellule: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          {r.ecart_titrage && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Titrage
            </Badge>
          )}
          {r.ecart_poids && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Poids
            </Badge>
          )}
          {r.ecart_notes && (
            <span className="text-xs text-muted-foreground">{r.ecart_notes}</span>
          )}
        </div>
      ),
    },
    {
      cle: "date_test",
      titre: "Constaté le",
      triable: true,
      className: "text-muted-foreground",
      cellule: (r) => (r.date_test ? formatDate(r.date_test) : "—"),
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={data}
      totalItems={totalItems}
      cleLigne={(r) => r.id}
      onRowClick={(r) => router.push(`/fonderie/suivi/bdl/${r.bdl_id}`)}
      placeholderRecherche="Rechercher un article, un envoi..."
      messageVide="Aucun écart constaté."
      groupements={[{ cle: "fonderie_nom", label: "Fonderie" }]}
    />
  );
}
