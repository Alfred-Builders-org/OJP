"use client";

import { DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { formatDate, formatCurrency } from "@/lib/format";
import type { RegistreObjet } from "@/types/registre";

interface RegistreTableProps {
  data: RegistreObjet[];
  totalItems: number;
}

export function RegistreTable({ data, totalItems }: RegistreTableProps) {
  /**
   * L'export passe par le serveur : un registre se présente en entier à un
   * contrôle, et n'exporter que la page consultée en livrerait une version
   * tronquée sans que rien ne le signale.
   */
  function exporter() {
    window.location.href = "/api/registre/export";
  }

  const colonnes: ColonneGrid<RegistreObjet>[] = [
    {
      cle: "numero_ordre",
      titre: "N°",
      triable: true,
      className: "tabular-nums font-medium",
      cellule: (r) => r.numero_ordre,
    },
    {
      cle: "date_entree",
      titre: "Entrée",
      triable: true,
      cellule: (r) => formatDate(r.date_entree),
    },
    {
      cle: "cedant",
      titre: "Cédant",
      triable: true,
      cellule: (r) => (
        <div className="min-w-0">
          <span className="font-medium">
            {[r.cedant_qualite, r.cedant_prenoms, r.cedant_nom]
              .filter(Boolean)
              .join(" ")}
          </span>
          {r.cedant_domicile && (
            <p className="text-xs text-muted-foreground">{r.cedant_domicile}</p>
          )}
        </div>
      ),
      groupe: (r) => r.cedant_nom,
    },
    {
      cle: "piece",
      titre: "Pièce d'identité",
      cellule: (r) =>
        r.piece_numero ? (
          <div className="min-w-0">
            <span className="text-sm">{r.piece_nature ?? "—"}</span>
            <p className="text-xs text-muted-foreground tabular-nums">
              {r.piece_numero}
            </p>
          </div>
        ) : (
          // Mention exigée par l'article R321-3 : son absence est le premier
          // manquement qu'un contrôle relève.
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                  <WarningCircle size={12} weight="duotone" className="mr-1" />
                  Manquante
                </Badge>
              }
            />
            <TooltipContent>
              Le registre doit porter la nature et le numéro de la pièce
              présentée par le cédant.
            </TooltipContent>
          </Tooltip>
        ),
    },
    {
      cle: "objet",
      titre: "Objet",
      cellule: (r) => (
        <div className="min-w-0">
          <span className="font-medium">{r.objet_nature}</span>
          {r.objet_description && (
            <p className="text-xs text-muted-foreground">{r.objet_description}</p>
          )}
        </div>
      ),
    },
    {
      cle: "provenance",
      titre: "Provenance",
      className: "text-muted-foreground text-sm",
      cellule: (r) => r.objet_provenance,
      groupe: (r) =>
        r.objet_provenance.startsWith("Depot") ? "Dépôt-vente" : "Achat",
    },
    {
      cle: "prix",
      titre: "Prix",
      triable: true,
      headClassName: "text-right",
      className: "text-right tabular-nums",
      cellule: (r) => (r.prix !== null ? formatCurrency(r.prix) : "—"),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={exporter}>
          <DownloadSimple size={16} weight="duotone" />
          Exporter le registre
        </Button>
      </div>

      <DataGrid
        colonnes={colonnes}
        donnees={data}
        totalItems={totalItems}
        cleLigne={(r) => r.id}
        placeholderRecherche="Rechercher un cédant, un objet..."
        messageVide="Aucune inscription au registre."
        groupements={[
          { cle: "cedant", label: "Cédant" },
          { cle: "provenance", label: "Provenance" },
        ]}
      />
    </>
  );
}
