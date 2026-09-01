"use client";

import * as React from "react";
import {
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  FunnelSimple,
  Rows,
  ArrowCounterClockwise,
  CaretRight,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDataGridState } from "@/hooks/use-data-grid-state";

export interface ColonneGrid<T> {
  /** Clé portée par l'URL pour le tri et le groupement. */
  cle: string;
  titre: string;
  /** Rendu de la cellule. */
  cellule: (ligne: T) => React.ReactNode;
  triable?: boolean;
  className?: string;
  headClassName?: string;
  /** Libellé du groupe auquel appartient la ligne, si groupement sur cette colonne. */
  groupe?: (ligne: T) => string;
}

export interface FiltreGrid {
  cle: string;
  label: string;
  options: readonly { value: string; label: string }[];
  /** Un seul choix à la fois. Par défaut, plusieurs valeurs cumulables. */
  unique?: boolean;
}

interface DataGridProps<T> {
  colonnes: ColonneGrid<T>[];
  donnees: T[];
  /** Nombre total de lignes correspondant aux filtres, côté serveur. */
  totalItems: number;
  cleLigne: (ligne: T) => string;
  onRowClick?: (ligne: T) => void;
  /** Menu ou boutons rendus dans la dernière colonne. */
  actions?: (ligne: T) => React.ReactNode;
  filtres?: FiltreGrid[];
  placeholderRecherche?: string;
  messageVide?: string;
  /** Colonnes proposées au groupement. Vide, le bouton n'apparaît pas. */
  groupements?: readonly { cle: string; label: string }[];
}

/**
 * Tableau de liste unifié : recherche, filtres et groupement en haut, tri dans
 * les en-têtes, pagination en bas.
 *
 * Les quatorze tableaux de l'application partageaient déjà tout leur squelette,
 * en treize copies d'un même en-tête triable et neuf copies de la navigation de
 * page. Ce qui variait — colonnes, rendu de cellule, filtres, actions par ligne
 * — est désormais passé en paramètre.
 *
 * L'état vit dans l'URL (voir `useDataGridState`), et c'est la page serveur qui
 * applique recherche, filtres et tri à sa requête : le filtrage local ne voyait
 * que la page affichée.
 */
export function DataGrid<T>({
  colonnes,
  donnees,
  totalItems,
  cleLigne,
  onRowClick,
  actions,
  filtres = [],
  placeholderRecherche = "Rechercher...",
  messageVide = "Aucun résultat.",
  groupements = [],
}: DataGridProps<T>) {
  const grid = useDataGridState();
  const [saisie, setSaisie] = React.useState(grid.search);

  // La saisie est locale et poussée dans l'URL après une pause : écrire dans
  // l'adresse à chaque frappe relancerait une requête serveur par caractère.
  React.useEffect(() => {
    if (saisie === grid.search) return;
    const minuteur = setTimeout(() => grid.setSearch(saisie), 350);
    return () => clearTimeout(minuteur);
  }, [saisie, grid]);

  // L'URL peut changer sans passer par le champ (retour navigateur, lien).
  React.useEffect(() => {
    setSaisie(grid.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.search]);

  const colonneGroupement = grid.groupBy
    ? colonnes.find((c) => c.cle === grid.groupBy)
    : null;

  const groupes = React.useMemo(() => {
    if (!colonneGroupement?.groupe) return null;
    const carte = new Map<string, T[]>();
    for (const ligne of donnees) {
      const libelle = colonneGroupement.groupe(ligne);
      const existant = carte.get(libelle);
      if (existant) existant.push(ligne);
      else carte.set(libelle, [ligne]);
    }
    return [...carte.entries()];
  }, [colonneGroupement, donnees]);

  const nbColonnes = colonnes.length + (actions ? 1 : 0);
  const aReinitialiser = grid.filtrageActif || grid.sort !== null || grid.groupBy !== null;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
      {/* Barre supérieure */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <MagnifyingGlass
            size={16}
            weight="duotone"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-8"
            placeholder={placeholderRecherche}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            aria-label={placeholderRecherche}
          />
        </div>

        {filtres.map((filtre) => (
          <FiltreColonne
            key={filtre.cle}
            filtre={filtre}
            valeurs={grid.filters[filtre.cle] ?? []}
            onChange={(v) => grid.setFilter(filtre.cle, v)}
          />
        ))}

        {groupements.length > 0 && (
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm">
                  <Rows size={16} weight="duotone" />
                  Grouper
                  {colonneGroupement && (
                    <Badge variant="secondary" className="ml-1">
                      {colonneGroupement.titre}
                    </Badge>
                  )}
                </Button>
              }
            />
            <PopoverContent align="start" className="w-48 p-1">
              <button
                type="button"
                className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                onClick={() => grid.setGroupBy(null)}
              >
                Aucun groupement
              </button>
              {groupements.map((g) => (
                <button
                  key={g.cle}
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                    grid.groupBy === g.cle && "bg-muted font-medium"
                  )}
                  onClick={() => grid.setGroupBy(g.cle)}
                >
                  {g.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {aReinitialiser && (
          <Button variant="ghost" size="sm" onClick={grid.reset}>
            <ArrowCounterClockwise size={16} weight="duotone" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Tableau */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-white dark:bg-card">
        <Table className={donnees.length === 0 ? "h-full" : ""}>
          <TableHeader>
            <TableRow>
              {colonnes.map((colonne) => (
                <TableHead
                  key={colonne.cle}
                  className={cn(colonne.headClassName, colonne.triable && "p-0")}
                >
                  {colonne.triable ? (
                    <button
                      type="button"
                      className="flex h-10 w-full items-center gap-1 px-2 text-left font-medium transition-colors hover:text-foreground"
                      onClick={() => grid.setSort(colonne.cle)}
                    >
                      {colonne.titre}
                      {grid.sort === colonne.cle ? (
                        grid.sortDir === "asc" ? (
                          <CaretUp size={12} weight="bold" />
                        ) : (
                          <CaretDown size={12} weight="bold" />
                        )
                      ) : (
                        <CaretUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    colonne.titre
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {donnees.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={nbColonnes} className="h-24 text-center text-muted-foreground">
                  {messageVide}
                </TableCell>
              </TableRow>
            ) : groupes ? (
              groupes.map(([libelle, lignes]) => (
                <React.Fragment key={libelle}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={nbColonnes}
                      className="bg-muted/50 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <CaretRight size={12} weight="bold" />
                        {libelle}
                        <Badge variant="secondary" className="font-normal">
                          {lignes.length}
                        </Badge>
                      </span>
                    </TableCell>
                  </TableRow>
                  {lignes.map((ligne) => (
                    <LigneGrid
                      key={cleLigne(ligne)}
                      ligne={ligne}
                      colonnes={colonnes}
                      actions={actions}
                      onRowClick={onRowClick}
                    />
                  ))}
                </React.Fragment>
              ))
            ) : (
              donnees.map((ligne) => (
                <LigneGrid
                  key={cleLigne(ligne)}
                  ligne={ligne}
                  colonnes={colonnes}
                  actions={actions}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        totalItems={totalItems}
        pageSize={grid.pageSize}
        currentPage={grid.page}
        onPageChange={grid.setPage}
        onPageSizeChange={grid.setPageSize}
      />
    </div>
  );
}

function LigneGrid<T>({
  ligne,
  colonnes,
  actions,
  onRowClick,
}: {
  ligne: T;
  colonnes: ColonneGrid<T>[];
  actions?: (ligne: T) => React.ReactNode;
  onRowClick?: (ligne: T) => void;
}) {
  return (
    <TableRow
      className={onRowClick ? "cursor-pointer" : undefined}
      onClick={onRowClick ? () => onRowClick(ligne) : undefined}
    >
      {colonnes.map((colonne) => (
        <TableCell key={colonne.cle} className={colonne.className}>
          {colonne.cellule(ligne)}
        </TableCell>
      ))}
      {actions && (
        // Le clic sur le menu ne doit pas ouvrir la ligne.
        <TableCell onClick={(e) => e.stopPropagation()}>{actions(ligne)}</TableCell>
      )}
    </TableRow>
  );
}

function FiltreColonne({
  filtre,
  valeurs,
  onChange,
}: {
  filtre: FiltreGrid;
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
}) {
  function basculer(value: string) {
    if (filtre.unique) {
      onChange(valeurs[0] === value ? [] : [value]);
      return;
    }
    onChange(
      valeurs.includes(value)
        ? valeurs.filter((v) => v !== value)
        : [...valeurs, value]
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <FunnelSimple size={16} weight="duotone" />
            {filtre.label}
            {valeurs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {valeurs.length}
              </Badge>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-56 p-1">
        {filtre.options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Checkbox
              checked={valeurs.includes(option.value)}
              onCheckedChange={() => basculer(option.value)}
            />
            {option.label}
          </label>
        ))}
        {valeurs.length > 0 && (
          <>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              className="flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              onClick={() => onChange([])}
            >
              Effacer
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
