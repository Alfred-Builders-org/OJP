"use client";

import { useRouter } from "next/navigation";
import { Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
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

// La catégorie se lit en bulle, comme le statut. Une couleur par nature, stable
// d'un écran à l'autre.
const TYPE_STYLES: Record<OperationRow["type"], string> = {
  rachat: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30",
  vente: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/30",
  depot_vente: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30",
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
      // Le statut d'abord : c'est ce qu'on cherche du regard. Un lot refusé,
      // rétracté ou annulé se lit en rouge, pas « finalisé » — le badge partagé
      // le fait déjà à partir de (status, outcome).
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (o) => <LotStatusBadge status={o.status} outcome={o.outcome} />,
      groupe: (o) => {
        if (o.status === "finalise" && o.outcome && o.outcome !== "complete") {
          return "Sans suite";
        }
        return STATUT_OPTIONS.find((s) => s.value === o.status)?.label ?? o.status;
      },
    },
    {
      cle: "type",
      titre: "Catégorie",
      cellule: (o) => (
        <Badge variant="secondary" className={TYPE_STYLES[o.type]}>
          {TYPE_LABELS[o.type]}
        </Badge>
      ),
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
      alignRight: true,
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
        // Deux groupes par défaut : ce qui demande une action en tête, ce qui
        // est terminé ensuite. C'est la vue que la cliente ouvre le matin.
        { cle: "avancement", label: "Avancement", groupe: (o) => (o.status === "finalise" ? "Terminées" : "En cours") },
        { cle: "type", label: "Catégorie" },
        { cle: "statut", label: "Statut" },
        { cle: "facture", label: "Facture" },
        { cle: "client", label: "Client" },
      ]}
      groupeParDefaut="avancement"
      ordreGroupes={["En cours", "Terminées"]}
    />
  );
}
