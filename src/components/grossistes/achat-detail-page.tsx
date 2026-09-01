"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Buildings,
  Diamond,
  NotePencil,
  Receipt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { formatDate, formatCurrency } from "@/lib/format";
import type { AchatGrossiste, Grossiste } from "@/types/grossiste";
import type { BijouxStock } from "@/types/bijoux";

interface AchatDetailPageProps {
  achat: AchatGrossiste;
  grossiste: Grossiste;
  articles: (BijouxStock & { reference_fournisseur?: string | null })[];
}

export function AchatDetailPage({
  achat,
  grossiste,
  articles,
}: AchatDetailPageProps) {
  const router = useRouter();

  const enStock = articles.filter((a) => a.statut === "en_stock").length;
  const vendus = articles.filter((a) => a.statut === "vendu").length;

  return (
    <>
      <Header
        title={achat.numero}
        backAction={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Retour"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        <Link href={`/grossistes/${grossiste.id}`}>
          <Button size="sm" variant="secondary">
            <Buildings size={16} weight="duotone" />
            {grossiste.nom}
          </Button>
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt size={20} weight="duotone" />
              L&apos;achat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(achat.date_achat)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">N° de facture</p>
                <p className="font-medium">{achat.numero_facture ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Articles</p>
                <p className="font-medium tabular-nums">
                  {articles.length}
                  {vendus > 0 && (
                    <span className="text-muted-foreground text-sm font-normal">
                      {" "}
                      · {enStock} en stock
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Montant acheté</p>
                <p className="font-medium">{formatCurrency(achat.montant_total)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valeur de revente</p>
                <p className="font-medium">{formatCurrency(achat.montant_revente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Diamond size={20} weight="duotone" />
              Articles entrés en stock ({articles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun article rattaché à cet achat.
              </p>
            ) : (
              <div className="rounded-lg border overflow-x-auto bg-white dark:bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="pl-4">Désignation</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Métal</TableHead>
                      <TableHead className="text-right">Poids</TableHead>
                      <TableHead className="text-right">Achat</TableHead>
                      <TableHead className="text-right">Revente</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow
                        key={article.id}
                        className="bg-white dark:bg-card cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/stock/${article.id}`)}
                      >
                        <TableCell className="pl-4 font-medium">{article.nom}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {article.reference_fournisseur ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {article.metaux ?? "—"}
                          {article.qualite ? ` ${article.qualite}` : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {article.poids !== null ? `${article.poids} g` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(article.prix_achat)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(article.prix_revente)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {article.statut === "en_stock"
                              ? "En stock"
                              : article.statut === "vendu"
                                ? "Vendu"
                                : article.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {achat.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotePencil size={20} weight="duotone" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{achat.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
