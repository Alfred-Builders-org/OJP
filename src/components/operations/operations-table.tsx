"use client";

import { useRouter } from "next/navigation";
import { Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { formatDate, formatCurrency } from "@/lib/format";
import type { OperationRow } from "@/types/operation";

/**
 * La liste des operations, toutes categories confondues.
 *
 * Les couleurs de statut suivent celles des ecrans de dossier (R-032) : un lot
 * finalise se lit pareil ici et sur sa fiche.
 */
const TYPE_OPTIONS = [
  { value: "rachat", label: "Rachat" },
  { value: "vente", label: "Vente" },
  { value: "depot_vente", label: "Dépôt-vente" },
] as const;

const STATUT_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_cours", label: "En cours" },
  { value: "finalise", label: "Finalisé" },
] as const;

const FACTURE_OPTIONS = [
  { value: "avec", label: "Avec facture" },
  { value: "sans", label: "Sans facture" },
] as const;

const TYPE_LABELS: Record<OperationRow["type"], string> = {
  rachat: "Rachat",
  vente: "Vente",
  depot_vente: "Dépôt-vente",
};

const STATUT_STYLES: Record<OperationRow["status"], string> = {
  brouillon: "bg-gray-500/10 text-gray-600 border-gray-600/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-400/30",
  en_cours: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-400/30",
  finalise: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/30",
};

const ISSUE_LABELS: Record<string, string> = {
  complete: "Menée à terme",
  refuse: "Refusée",
  retracte: "Rétractée",
  annule: "Annulée",
};

interface OperationsTableProps {
  operations: OperationRow[];
  total: number;
}

export function OperationsTable({ operations, total }: OperationsTableProps) {
  const router = useRouter();

  /** Un rachat se lit sur sa fiche de lot, une vente sur la sienne. */
  function urlOperation(o: OperationRow): string {
    if (o.type === "vente") return `/ventes/${o.id}`;
    if (o.type === "depot_vente") return `/depot-vente/${o.id}`;
    return `/lots/${o.id}`;
  }

  /** Le montant qui parle : ce qu'on a paye au rachat, encaisse a la vente. */
  function montant(o: OperationRow): number | null {
    return o.type === "rachat" ? o.total_prix_achat : o.total_prix_revente;
  }

  const colonnes: ColonneGrid<OperationRow>[] = [
    {
      cle: "numero",
      titre: "N°",
      triable: true,
      className: "font-medium tabular-nums",
      cellule: (o) => o.numero,
    },
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (o) => formatDate(o.date_finalisation ?? o.created_at),
    },
    {
      cle: "type",
      titre: "Catégorie",
      cellule: (o) => TYPE_LABELS[o.type],
      groupe: (o) => TYPE_LABELS[o.type],
    },
    {
      cle: "client",
      titre: "Client",
      cellule: (o) => {
        const c = o.dossier?.client;
        return c ? `${c.first_name} ${c.last_name}`.trim() : "—";
      },
      groupe: (o) => {
        const c = o.dossier?.client;
        return c ? `${c.first_name} ${c.last_name}`.trim() : "—";
      },
    },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (o) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant="outline" className={STATUT_STYLES[o.status]}>
            {STATUT_OPTIONS.find((s) => s.value === o.status)?.label ?? o.status}
          </Badge>
          {o.outcome && o.outcome !== "complete" && (
            <span className="text-xs text-muted-foreground">
              {ISSUE_LABELS[o.outcome]}
            </span>
          )}
        </div>
      ),
      groupe: (o) => STATUT_OPTIONS.find((s) => s.value === o.status)?.label ?? o.status,
    },
    {
      cle: "facture",
      titre: "Facture",
      cellule: (o) =>
        o.factures.length > 0 ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Receipt size={14} weight="duotone" className="text-muted-foreground shrink-0" />
            <span className="tabular-nums">{o.factures[0].numero}</span>
            {o.factures.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{o.factures.length - 1}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      groupe: (o) => (o.factures.length > 0 ? "Avec facture" : "Sans facture"),
    },
    {
      cle: "montant",
      titre: "Montant",
      triable: true,
      headClassName: "text-right",
      className: "text-right tabular-nums",
      cellule: (o) => {
        const m = montant(o);
        return m !== null && m !== 0 ? formatCurrency(m) : "—";
      },
    },
  ];

  return (
    <DataGrid
      colonnes={colonnes}
      donnees={operations}
      totalItems={total}
      cleLigne={(o) => o.id}
      onRowClick={(o) => router.push(urlOperation(o))}
      placeholderRecherche="Rechercher un numéro, un client..."
      messageVide="Aucune opération ne correspond."
      filtres={[
        { cle: "type", label: "Catégorie", options: TYPE_OPTIONS },
        { cle: "statut", label: "Statut", options: STATUT_OPTIONS },
        { cle: "facture", label: "Facture", options: FACTURE_OPTIONS, unique: true },
      ]}
      groupements={[
        { cle: "type", label: "Catégorie" },
        { cle: "statut", label: "Statut" },
        { cle: "facture", label: "Facture" },
        { cle: "client", label: "Client" },
      ]}
    />
  );
}
