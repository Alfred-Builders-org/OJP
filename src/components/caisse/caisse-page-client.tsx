"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, DownloadSimple, Money } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
  type MouvementCaisse,
} from "@/lib/reglements/caisse";

interface CaissePageClientProps {
  jour: string;
  mouvements: MouvementCaisse[];
}

/** Decale la date d'un nombre de jours, sans toucher au fuseau. */
function decaler(jour: string, jours: number): string {
  const d = new Date(`${jour}T12:00:00`);
  d.setDate(d.getDate() + jours);
  return d.toLocaleDateString("sv-SE");
}

export function CaissePageClient({ jour, mouvements }: CaissePageClientProps) {
  const router = useRouter();

  const lignes = useMemo(() => ventiler(mouvements), [mouvements]);
  const totaux = useMemo(() => totaliser(lignes), [lignes]);

  const colonnes: ColonneCaisse[] = [
    "reparations",
    ...COLONNES_ENTRANTES,
    ...COLONNES_SORTANTES,
  ];

  function allerAu(nouveauJour: string) {
    router.push(`/caisse?jour=${nouveauJour}`);
  }

  function exporter() {
    const contenu = construireCsv(lignes, [
      { entete: "Heure", valeur: (l) => new Date(l.date_reglement).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
      { entete: "Nom", valeur: (l) => l.libelle },
      { entete: "Référence", valeur: (l) => l.reference ?? "" },
      { entete: "Enregistré", valeur: (l) => l.numero_registre ?? "" },
      { entete: "Colonne", valeur: (l) => LIBELLES_COLONNES[l.colonne] },
      { entete: "Sens", valeur: (l) => (l.colonne === "reparations" ? "Réparation" : l.sens === "entrant" ? "Ils achètent" : "J'achète") },
      { entete: "Montant", valeur: (l) => l.montant.toFixed(2).replace(".", ",") },
    ]);
    telechargerCsv(contenu, `caisse-${jour}.csv`);
  }

  const dateLisible = new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Barre de navigation dans les jours */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => allerAu(decaler(jour, -1))}
            aria-label="Jour précédent"
          >
            <CaretLeft size={14} weight="regular" />
          </Button>
          <Input
            type="date"
            value={jour}
            onChange={(e) => e.target.value && allerAu(e.target.value)}
            className="w-auto"
            aria-label="Jour de la feuille de caisse"
          />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => allerAu(decaler(jour, 1))}
            aria-label="Jour suivant"
          >
            <CaretRight size={14} weight="regular" />
          </Button>
          <span className="ml-1 text-sm text-muted-foreground first-letter:uppercase">
            {dateLisible}
          </span>
        </div>

        <Button variant="outline" size="sm" onClick={exporter} disabled={lignes.length === 0}>
          <DownloadSimple size={16} weight="duotone" />
          Exporter
        </Button>
      </div>

      {/* Les trois chiffres du soir */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ils achètent</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totalEntrant(totaux))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">J&apos;achète</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totalSortant(totaux))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mouvement net</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(solde(totaux))}</p>
          </CardContent>
        </Card>
      </div>

      {/* La feuille elle-meme */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Nom</TableHead>
                <TableHead className="whitespace-nowrap">Enregistré</TableHead>
                <TableHead className="text-right whitespace-nowrap">Réparations</TableHead>
                {COLONNES_ENTRANTES.map((c) => (
                  <TableHead key={c} className="text-right whitespace-nowrap">
                    {LIBELLES_COLONNES[c]}
                  </TableHead>
                ))}
                {COLONNES_SORTANTES.map((c) => (
                  <TableHead key={c} className="text-right whitespace-nowrap text-muted-foreground">
                    {LIBELLES_COLONNES[c]}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead colSpan={2} />
                <TableHead className="text-right text-xs font-normal text-muted-foreground">
                  atelier
                </TableHead>
                <TableHead colSpan={COLONNES_ENTRANTES.length} className="text-center text-xs font-normal text-muted-foreground">
                  ils achètent
                </TableHead>
                <TableHead colSpan={COLONNES_SORTANTES.length} className="text-center text-xs font-normal text-muted-foreground">
                  j&apos;achète
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colonnes.length + 2} className="h-32 text-center text-muted-foreground">
                    <Money size={24} weight="duotone" className="mx-auto mb-2 opacity-40" />
                    Aucun mouvement ce jour-là.
                  </TableCell>
                </TableRow>
              ) : (
                lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell>
                      <span className="font-medium">{ligne.libelle}</span>
                      {ligne.reference && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{ligne.reference}</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {ligne.numero_registre ?? ""}
                    </TableCell>
                    {colonnes.map((colonne) => (
                      <TableCell key={colonne} className="text-right tabular-nums">
                        {ligne.colonne === colonne ? formatCurrency(ligne.montant) : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
            {lignes.length > 0 && (
              <tfoot className="border-t bg-muted/40">
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">
                    Totaux
                  </TableCell>
                  {colonnes.map((colonne) => (
                    <TableCell key={colonne} className="text-right font-medium tabular-nums">
                      {totaux[colonne] !== 0 ? formatCurrency(totaux[colonne]) : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
