"use client";

import { useMemo, useState } from "react";
import { Scales, WarningCircle } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DownloadSimple } from "@phosphor-icons/react";
import { construireCsv, telechargerCsv, nomFichierDate, nombreFr } from "@/lib/export-csv";
import { formatCurrency } from "@/lib/format";
import {
  construireRegistreMarge,
  type AchatSousMarge,
  type GranulariteMarge,
  type PeriodeMarge,
  type VenteSousMarge,
} from "@/lib/calculations/registre-marge";

interface RegistreMargeTableProps {
  ventes: VenteSousMarge[];
  achats: AchatSousMarge[];
}

/**
 * Le registre des ventes sous le regime de la marge.
 *
 * Il ne decide rien : la facturation reste au bijou par bijou, qui est ce que
 * portent les factures deja emises. L'ecran met la globalisation en regard pour
 * que le choix se fasse avec le comptable, chiffres en main.
 */
export function RegistreMargeTable({ ventes, achats }: RegistreMargeTableProps) {
  const [granularite, setGranularite] = useState<GranulariteMarge>("mois");

  const registre = useMemo(
    () => construireRegistreMarge({ ventes, achats, granularite }),
    [ventes, achats, granularite]
  );

  const totaux = useMemo(
    () =>
      registre.reduce(
        (acc, p) => ({
          tvaDetaillee: acc.tvaDetaillee + p.tvaDetaillee,
          tvaGlobalisee: acc.tvaGlobalisee + p.tvaGlobalisee,
          perteNonImputee: acc.perteNonImputee + p.perteNonImputee,
        }),
        { tvaDetaillee: 0, tvaGlobalisee: 0, perteNonImputee: 0 }
      ),
    [registre]
  );

  const ecart = totaux.tvaDetaillee - totaux.tvaGlobalisee;

  function exporter() {
    const csv = construireCsv(
      registre,
      [
        { entete: "Periode", valeur: (p: PeriodeMarge) => p.libelle },
        { entete: "Ventes", valeur: (p: PeriodeMarge) => nombreFr(p.totalVentes) },
        { entete: "Achats", valeur: (p: PeriodeMarge) => nombreFr(p.totalAchats) },
        { entete: "Marge bijou par bijou", valeur: (p: PeriodeMarge) => nombreFr(p.margeDetaillee) },
        { entete: "TVA bijou par bijou", valeur: (p: PeriodeMarge) => nombreFr(p.tvaDetaillee) },
        { entete: "Marge globalisee", valeur: (p: PeriodeMarge) => nombreFr(p.margeGlobaleBrute) },
        { entete: "Report entrant", valeur: (p: PeriodeMarge) => nombreFr(p.reportEntrant) },
        { entete: "Marge taxable globalisee", valeur: (p: PeriodeMarge) => nombreFr(p.margeGlobaleTaxable) },
        { entete: "TVA globalisee", valeur: (p: PeriodeMarge) => nombreFr(p.tvaGlobalisee) },
      ]
    );
    telechargerCsv(csv, nomFichierDate("registre-de-la-marge"));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Ventes de biens d&apos;occasion relevant de l&apos;article 297 A du
          CGI. Les factures appliquent la méthode bijou par bijou ; la
          globalisation est présentée en regard, elle suppose un choix pris avec
          le comptable.
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={granularite}
            onValueChange={(v) => setGranularite((v as GranulariteMarge) || "mois")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Par mois</SelectItem>
              <SelectItem value="trimestre">Par trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exporter} disabled={registre.length === 0}>
            <DownloadSimple size={14} weight="duotone" />
            Exporter
          </Button>
        </div>
      </div>

      {registre.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Scales size={28} weight="duotone" className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune vente sous le régime de la marge pour l&apos;instant.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Recap
              titre="TVA due, bijou par bijou"
              valeur={formatCurrency(totaux.tvaDetaillee)}
              detail="Ce que portent les factures émises"
            />
            <Recap
              titre="TVA due, globalisée"
              valeur={formatCurrency(totaux.tvaGlobalisee)}
              detail={
                ecart > 0
                  ? `${formatCurrency(ecart)} de moins sur la période couverte`
                  : ecart < 0
                    ? `${formatCurrency(-ecart)} de plus sur la période couverte`
                    : "Même résultat sur la période couverte"
              }
            />
            <Recap
              titre="Pertes non imputées"
              valeur={formatCurrency(totaux.perteNonImputee)}
              detail="Ventes à perte que la méthode bijou par bijou laisse tomber"
              alerte={totaux.perteNonImputee > 0}
            />
          </div>

          <div className="rounded-lg border overflow-x-auto bg-white dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead rowSpan={2} className="pl-4 align-bottom">Période</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">Ventes</TableHead>
                  <TableHead rowSpan={2} className="text-right align-bottom">Achats</TableHead>
                  <TableHead colSpan={2} className="border-l text-center">
                    Bijou par bijou
                  </TableHead>
                  <TableHead colSpan={3} className="border-l text-center">
                    Globalisation
                  </TableHead>
                </TableRow>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="border-l text-right">Marge</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="border-l text-right">Marge</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                  <TableHead className="pr-4 text-right">TVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registre.map((p) => (
                  <TableRow key={p.cle}>
                    <TableCell className="pl-4 font-medium">
                      {p.libelle}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {p.nbVentes} vente{p.nbVentes > 1 ? "s" : ""}
                        {p.nbVentesAPerte > 0 && (
                          <span className="text-amber-700 dark:text-amber-400">
                            {" "}
                            · {p.nbVentesAPerte} à perte
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.totalVentes)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.totalAchats)}
                    </TableCell>
                    <TableCell className="border-l text-right tabular-nums">
                      {formatCurrency(p.margeDetaillee)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(p.tvaDetaillee)}
                    </TableCell>
                    <TableCell className="border-l text-right tabular-nums">
                      {formatCurrency(p.margeGlobaleTaxable)}
                      {p.margeGlobaleBrute < 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {formatCurrency(p.margeGlobaleBrute)} brut
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.reportEntrant < 0 ? formatCurrency(p.reportEntrant) : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular-nums">
                      {formatCurrency(p.tvaGlobalisee)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            En globalisation, la marge d&apos;une période compte tous les achats
            entrés en stock, y compris ceux qui ne sont pas encore revendus, et
            une période négative se reporte sur la suivante.
          </p>
        </>
      )}
    </div>
  );
}

function Recap({
  titre,
  valeur,
  detail,
  alerte,
}: {
  titre: string;
  valeur: string;
  detail: string;
  alerte?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {alerte && <WarningCircle size={12} weight="duotone" className="text-amber-600" />}
        {titre}
      </p>
      <p className="text-lg font-bold tabular-nums">{valeur}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
