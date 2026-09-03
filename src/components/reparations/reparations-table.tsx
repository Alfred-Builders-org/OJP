"use client";

import { useState } from "react";
import { CurrencyEur, Plus, Wrench } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { EncaissementDialog } from "@/components/reglements/encaissement-dialog";
import { ReparationCreateDialog } from "@/components/reparations/reparation-create-dialog";
import { formatDate, formatCurrency } from "@/lib/format";
import type { ReparationRow } from "@/types/reparation";

const STATUT_OPTIONS = [
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
] as const;

const STATUT_STYLES: Record<string, string> = {
  en_cours: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-400/30",
  terminee: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/30",
};

interface ReparationsTableProps {
  reparations: ReparationRow[];
  total: number;
}

export function ReparationsTable({ reparations, total }: ReparationsTableProps) {
  const [creation, setCreation] = useState(false);
  const [aEncaisser, setAEncaisser] = useState<ReparationRow | null>(null);

  /** Ce qu'on repare : un bijou du stock, ou l'objet decrit par le vendeur. */
  function objet(r: ReparationRow): string {
    return r.designation ?? r.bijou?.nom ?? "—";
  }

  function proprietaire(r: ReparationRow): string {
    if (r.client) return `${r.client.first_name} ${r.client.last_name}`.trim();
    return r.bijou ? "Stock boutique" : "—";
  }

  function resteDu(r: ReparationRow): number {
    return Math.round(((r.prix_facture ?? 0) - r.encaisse) * 100) / 100;
  }

  const colonnes: ColonneGrid<ReparationRow>[] = [
    {
      cle: "objet",
      titre: "Objet",
      cellule: (r) => (
        <div className="min-w-0">
          <span className="font-medium">{objet(r)}</span>
          {r.description && (
            <p className="text-xs text-muted-foreground">{r.description}</p>
          )}
        </div>
      ),
    },
    {
      cle: "proprietaire",
      titre: "Propriétaire",
      cellule: (r) => proprietaire(r),
      groupe: (r) => (r.client ? "Client" : "Stock boutique"),
    },
    {
      cle: "date_envoi",
      titre: "Déposée",
      triable: true,
      cellule: (r) => formatDate(r.date_envoi),
    },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (r) => (
        <Badge variant="outline" className={STATUT_STYLES[r.statut]}>
          {STATUT_OPTIONS.find((s) => s.value === r.statut)?.label ?? r.statut}
        </Badge>
      ),
      groupe: (r) => STATUT_OPTIONS.find((s) => s.value === r.statut)?.label ?? r.statut,
    },
    {
      cle: "prix",
      titre: "Prix client",
      triable: true,
      headClassName: "text-right",
      className: "text-right tabular-nums",
      cellule: (r) => (r.prix_facture ? formatCurrency(r.prix_facture) : "—"),
    },
    {
      cle: "reste",
      titre: "Reste dû",
      headClassName: "text-right",
      className: "text-right tabular-nums",
      cellule: (r) => {
        const reste = resteDu(r);
        if (!r.prix_facture) return <span className="text-muted-foreground">—</span>;
        return reste <= 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400">Réglée</span>
        ) : (
          formatCurrency(reste)
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreation(true)}>
          <Plus size={14} weight="bold" />
          Réparation d&apos;un bijou apporté
        </Button>
      </div>

      <DataGrid
        colonnes={colonnes}
        donnees={reparations}
        totalItems={total}
        cleLigne={(r) => r.id}
        placeholderRecherche="Rechercher un objet..."
        messageVide="Aucune réparation."
        filtres={[{ cle: "statut", label: "Statut", options: STATUT_OPTIONS }]}
        groupements={[
          { cle: "statut", label: "Statut" },
          { cle: "proprietaire", label: "Propriétaire" },
        ]}
        actions={(r) =>
          r.prix_facture && resteDu(r) > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setAEncaisser(r)}>
              <CurrencyEur size={14} weight="duotone" />
              Encaisser
            </Button>
          ) : null
        }
      />

      <ReparationCreateDialog open={creation} onOpenChange={setCreation} />

      {aEncaisser && (
        <EncaissementDialog
          open={aEncaisser !== null}
          onOpenChange={(v) => !v && setAEncaisser(null)}
          titre="Encaisser la réparation"
          description={`${objet(aEncaisser)} — ${proprietaire(aEncaisser)}`}
          type="reparation"
          sens="entrant"
          reparationId={aEncaisser.id}
          clientId={aEncaisser.client_id}
          montantSuggere={resteDu(aEncaisser)}
          onEnregistre={() => setAEncaisser(null)}
        />
      )}

      {reparations.length === 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Wrench size={16} weight="duotone" />
          Les réparations d&apos;articles du stock se lancent depuis la fiche de
          l&apos;article.
        </p>
      )}
    </>
  );
}
