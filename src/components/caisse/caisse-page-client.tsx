"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bank,
  CaretLeft,
  CaretRight,
  Check as CheckIcon,
  CreditCard,
  DownloadSimple,
  Money,
  Scales,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { LotStatusBadge } from "@/components/lots/lot-status-badge";
import { formatCurrency } from "@/lib/format";
import { construireCsv, telechargerCsv } from "@/lib/export-csv";
import {
  ventiler,
  totaliser,
  totalEntrant,
  totalSortant,
  solde,
  COLONNES_ENTRANTES,
  COLONNES_SORTANTES,
  LIBELLES_COLONNES,
  type ColonneCaisse,
  type LigneCaisse,
  type MouvementCaisse,
} from "@/lib/reglements/caisse";
import type { LotOutcome } from "@/types/lot";
import type { ModeReglement } from "@/types/reglement";

interface CaissePageClientProps {
  jour: string;
  mouvements: MouvementCaisse[];
}

function decaler(jour: string, jours: number): string {
  const d = new Date(`${jour}T12:00:00`);
  d.setDate(d.getDate() + jours);
  return d.toLocaleDateString("sv-SE");
}

function totalLigneEntrant(l: LigneCaisse): number {
  return l.sens === "entrant" ? l.montant : 0;
}
function totalLigneSortant(l: LigneCaisse): number {
  return l.sens === "sortant" ? l.montant : 0;
}

const LABEL_TYPE_LOT: Record<string, string> = {
  rachat: "Rachat",
  vente: "Vente",
  depot_vente: "Dépôt-vente",
  fonte: "Fonte",
  reparation: "Réparation",
  achat: "Achat fournisseur",
};

/** Chaque mode de paiement a son icône, la même pour l'encaissement et le décaissement. */
const ICONE_MODE: Record<ModeReglement, Icon> = {
  especes: Money,
  carte: CreditCard,
  virement: Bank,
  cheque: CheckIcon,
};

/** L'icône d'une colonne, dérivée de son mode. */
function iconePourColonne(colonne: ColonneCaisse): Icon {
  const mode = colonne.replace(/^(entrant|sortant)_/, "") as ModeReglement;
  return ICONE_MODE[mode];
}

export function CaissePageClient({ jour, mouvements }: CaissePageClientProps) {
  const router = useRouter();

  const lignes = useMemo(() => ventiler(mouvements), [mouvements]);
  const totaux = useMemo(() => totaliser(lignes), [lignes]);
  const totauxEntrant = totalEntrant(totaux);
  const totauxSortant = totalSortant(totaux);

  function allerAu(nouveauJour: string) {
    router.push(`/caisse?jour=${nouveauJour}`);
  }

  function exporter() {
    const contenu = construireCsv(lignes, [
      { entete: "Heure", valeur: (l) => new Date(l.date_reglement).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
      { entete: "Lot", valeur: (l) => l.numero_lot ?? "" },
      { entete: "Type", valeur: (l) => (l.lot_type ? LABEL_TYPE_LOT[l.lot_type] ?? l.lot_type : "") },
      { entete: "Tiers", valeur: (l) => l.tiers },
      { entete: "Sens", valeur: (l) => (l.sens === "entrant" ? "Encaissement" : "Décaissement") },
      { entete: "Mode", valeur: (l) => LIBELLES_COLONNES[l.colonne] },
      { entete: "Montant", valeur: (l) => l.montant.toFixed(2).replace(".", ",") },
    ]);
    telechargerCsv(contenu, `caisse-${jour}.csv`);
  }

  const nbColonnes = 1 + COLONNES_ENTRANTES.length + 1 + COLONNES_SORTANTES.length + 1;

  const CELL_BASE = "border-r border-border";
  const CELL_SEP_BLOC = "border-r-2 border-border";

  return (
    // Trois zones fixes, entre lesquelles le tableau prend le reste et scrolle.
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      {/* 1. Barre de navigation dans les jours (hauteur fixe) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => allerAu(decaler(jour, -1))} aria-label="Jour précédent">
            <CaretLeft size={14} weight="regular" />
          </Button>
          <DatePicker
            value={new Date(`${jour}T12:00:00`)}
            onChange={(d) => d && allerAu(d.toLocaleDateString("sv-SE"))}
            className="w-56 first-letter:uppercase"
          />
          <Button variant="outline" size="icon-sm" onClick={() => allerAu(decaler(jour, 1))} aria-label="Jour suivant">
            <CaretRight size={14} weight="regular" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={exporter} disabled={lignes.length === 0}>
          <DownloadSimple size={16} weight="duotone" />
          Exporter
        </Button>
      </div>

      {/* 2. Trois chiffres du soir — neutres, icônes de flèches (hauteur fixe) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm py-0">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDown size={12} weight="bold" />
              Encaissements
            </p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totauxEntrant)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm py-0">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUp size={12} weight="bold" />
              Décaissements
            </p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totauxSortant)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm py-0">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Scales size={12} weight="duotone" />
              Mouvement net
            </p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(solde(totaux))}</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tableau — prend le reste de la place, scrolle à l'intérieur */}
      <Card className="shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden py-0">
        <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr>
                <th className={`${CELL_SEP_BLOC} bg-muted/40 border-b`} />
                <th
                  colSpan={COLONNES_ENTRANTES.length + 1}
                  className={`${CELL_SEP_BLOC} border-b bg-emerald-50 py-2 text-center text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400`}
                >
                  Encaissements
                </th>
                <th
                  colSpan={COLONNES_SORTANTES.length + 1}
                  className="border-b bg-red-50 py-2 text-center text-xs font-semibold uppercase tracking-wider text-red-700 dark:bg-red-950/30 dark:text-red-400"
                >
                  Décaissements
                </th>
              </tr>
              <tr className="border-b">
                <th className={`${CELL_SEP_BLOC} bg-muted/40 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground`}>
                  Lot
                </th>
                {COLONNES_ENTRANTES.map((c) => {
                  const Ic = iconePourColonne(c);
                  return (
                    <th
                      key={c}
                      className={`${CELL_BASE} bg-emerald-50/70 px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Ic size={12} weight="duotone" />
                        {LIBELLES_COLONNES[c]}
                      </span>
                    </th>
                  );
                })}
                <th
                  className={`${CELL_SEP_BLOC} bg-emerald-100/80 px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`}
                >
                  Total
                </th>
                {COLONNES_SORTANTES.map((c) => {
                  const Ic = iconePourColonne(c);
                  return (
                    <th
                      key={c}
                      className={`${CELL_BASE} bg-red-50/70 px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-red-700 dark:bg-red-950/20 dark:text-red-400`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Ic size={12} weight="duotone" />
                        {LIBELLES_COLONNES[c]}
                      </span>
                    </th>
                  );
                })}
                <th
                  className="bg-red-100/80 px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-red-800 dark:bg-red-900/40 dark:text-red-300"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={nbColonnes} className="h-32 text-center text-muted-foreground">
                    <Money size={24} weight="duotone" className="mx-auto mb-2 opacity-40" />
                    Aucun mouvement ce jour-là.
                  </td>
                </tr>
              ) : (
                lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className={`${CELL_SEP_BLOC} px-3 py-2 align-top`}>
                      <div className="flex flex-col gap-1 min-w-56">
                        <div className="flex items-center gap-2">
                          {ligne.lot_status ? (
                            <LotStatusBadge
                              status={ligne.lot_status}
                              outcome={ligne.lot_outcome as LotOutcome | null}
                            />
                          ) : (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {ligne.lot_type === "reparation" ? "Réparation" : ligne.lot_type === "achat" ? "Achat fournisseur" : "—"}
                            </span>
                          )}
                          {ligne.numero_lot && (
                            <span className="font-medium tabular-nums text-foreground">{ligne.numero_lot}</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{ligne.tiers}</span>
                      </div>
                    </td>

                    {COLONNES_ENTRANTES.map((colonne) => (
                      <td key={colonne} className={`${CELL_BASE} bg-emerald-50/30 px-3 py-2 text-right tabular-nums dark:bg-emerald-950/10`}>
                        {ligne.colonne === colonne ? formatCurrency(ligne.montant) : ""}
                      </td>
                    ))}
                    <td className={`${CELL_SEP_BLOC} bg-emerald-100/50 px-3 py-2 text-right font-semibold tabular-nums text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-300`}>
                      {totalLigneEntrant(ligne) !== 0 ? formatCurrency(totalLigneEntrant(ligne)) : ""}
                    </td>

                    {COLONNES_SORTANTES.map((colonne) => (
                      <td key={colonne} className={`${CELL_BASE} bg-red-50/30 px-3 py-2 text-right tabular-nums dark:bg-red-950/10`}>
                        {ligne.colonne === colonne ? formatCurrency(ligne.montant) : ""}
                      </td>
                    ))}
                    <td className="bg-red-100/50 px-3 py-2 text-right font-semibold tabular-nums text-red-800 dark:bg-red-900/25 dark:text-red-300">
                      {totalLigneSortant(ligne) !== 0 ? formatCurrency(totalLigneSortant(ligne)) : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 4. Carte totaux — fixe en bas, ne scrolle pas avec le tableau */}
      {lignes.length > 0 && (
        <Card className="shadow-sm py-0">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className={`${CELL_SEP_BLOC} bg-muted/50 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
                    Totaux
                  </td>
                  {COLONNES_ENTRANTES.map((colonne) => (
                    <td key={colonne} className={`${CELL_BASE} bg-emerald-50/70 px-3 py-3 text-right font-semibold tabular-nums dark:bg-emerald-950/20`}>
                      {totaux[colonne] !== 0 ? formatCurrency(totaux[colonne]) : "—"}
                    </td>
                  ))}
                  <td className={`${CELL_SEP_BLOC} bg-emerald-100/80 px-3 py-3 text-right font-bold tabular-nums text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`}>
                    {formatCurrency(totauxEntrant)}
                  </td>
                  {COLONNES_SORTANTES.map((colonne) => (
                    <td key={colonne} className={`${CELL_BASE} bg-red-50/70 px-3 py-3 text-right font-semibold tabular-nums dark:bg-red-950/20`}>
                      {totaux[colonne] !== 0 ? formatCurrency(totaux[colonne]) : "—"}
                    </td>
                  ))}
                  <td className="bg-red-100/80 px-3 py-3 text-right font-bold tabular-nums text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    {formatCurrency(totauxSortant)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
