"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  CurrencyEur,
  Wallet,
  Receipt,
  CheckCircle,
  Money,
  CreditCard,
  Bank,
  Check as CheckIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentsTable } from "@/components/documents/documents-table";
import { EncaissementDialog } from "@/components/reglements/encaissement-dialog";
import { emettreFactureReparation } from "@/lib/actions/reparation-actions";
import { formatDate, formatCurrency } from "@/lib/format";
import type { ReparationRow } from "@/types/reparation";
import type { DocumentRecord } from "@/types/document";
import type { Reglement, ModeReglement } from "@/types/reglement";

const MODE_ICONS: Record<ModeReglement, typeof Money> = {
  especes: Money,
  carte: CreditCard,
  virement: Bank,
  cheque: CheckIcon,
};
const MODE_LABELS: Record<ModeReglement, string> = {
  especes: "Espèces",
  carte: "Carte",
  virement: "Virement",
  cheque: "Chèque",
};

interface ReparationDetailPageProps {
  reparation: ReparationRow;
  documents: DocumentRecord[];
  reglements: Reglement[];
}

export function ReparationDetailPage({
  reparation,
  documents,
  reglements,
}: ReparationDetailPageProps) {
  const router = useRouter();
  const [encaisserOuvert, setEncaisserOuvert] = useState(false);
  const [facturation, setFacturation] = useState(false);

  const objet = reparation.designation ?? reparation.bijou?.nom ?? "Réparation";
  const proprietaire = reparation.client
    ? `${reparation.client.first_name} ${reparation.client.last_name}`.trim()
    : reparation.bijou
      ? "Stock boutique"
      : "—";

  const prix = reparation.prix_facture ?? 0;
  const resteDu = Math.round((prix - reparation.encaisse) * 100) / 100;
  const regle = prix > 0 && resteDu <= 0;
  const aFacture = documents.length > 0;

  async function facturer() {
    setFacturation(true);
    const resultat = await emettreFactureReparation(reparation.id);
    setFacturation(false);
    if ("error" in resultat) {
      toast.error(resultat.error);
      return;
    }
    toast.success(`Facture ${resultat.numero} émise`);
    router.refresh();
  }

  async function marquerTerminee() {
    const supabase = createClient();
    const { error } = await mutate(
      supabase
        .from("reparations")
        .update({ statut: "terminee", date_retour: new Date().toISOString() })
        .eq("id", reparation.id),
      "La réparation n'a pas pu être mise à jour",
      "Réparation marquée terminée",
    );
    if (!error) router.refresh();
  }

  return (
    <>
      <Header
        title={objet}
        backAction={
          <Button variant="ghost" size="icon-sm" aria-label="Retour" onClick={() => router.push("/reparations")}>
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        {reparation.statut === "en_cours" && (
          <Button size="sm" variant="outline" onClick={marquerTerminee}>
            <CheckCircle size={16} weight="duotone" />
            Marquer terminée
          </Button>
        )}
      </Header>

      <div className="flex-1 overflow-y-auto min-w-0 px-6 pt-6 pb-8 space-y-6">
        {/* Objet et propriétaire */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench size={20} weight="duotone" />
              {objet}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  reparation.statut === "terminee"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }
              >
                {reparation.statut === "terminee" ? "Terminée" : "En cours"}
              </Badge>
              <Badge
                variant="secondary"
                className={
                  regle
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }
              >
                {regle ? "Réglée" : "À encaisser"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Detail label="Propriétaire" value={proprietaire} />
              <Detail label="Déposée le" value={formatDate(reparation.date_envoi)} />
              {reparation.description && (
                <div className="col-span-2">
                  <Detail label="Travail à faire" value={reparation.description} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Récapitulatif financier */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CurrencyEur size={12} weight="duotone" /> Prix client
            </p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(prix)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet size={12} weight="duotone" /> Encaissé
            </p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(reparation.encaisse)}</p>
          </div>
          <div
            className={`rounded-lg border p-3 space-y-1 ${
              regle
                ? "border-emerald-600/30 bg-emerald-500/10 dark:border-emerald-400/30"
                : "bg-muted/30"
            }`}
          >
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Receipt size={12} weight="duotone" /> Reste dû
            </p>
            <p className="text-lg font-bold tabular-nums">
              {regle ? "—" : formatCurrency(resteDu)}
            </p>
          </div>
        </div>

        {/* Facture */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt size={20} weight="duotone" />
              Facture
            </CardTitle>
            {!aFacture && (
              <Button size="sm" onClick={facturer} disabled={facturation || prix <= 0 || !reparation.client}>
                <Receipt size={16} weight="duotone" />
                {facturation ? "Émission..." : "Émettre la facture"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {aFacture ? (
              <DocumentsTable documents={documents} title="" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {prix <= 0
                  ? "Renseignez un prix client pour pouvoir facturer."
                  : !reparation.client
                    ? "Une facture demande un propriétaire."
                    : "Aucune facture émise pour l'instant."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Encaissements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet size={20} weight="duotone" />
              Encaissements
            </CardTitle>
            {!regle && prix > 0 && (
              <Button size="sm" variant="outline" onClick={() => setEncaisserOuvert(true)}>
                <CurrencyEur size={16} weight="duotone" />
                Encaisser
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {reglements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun encaissement.</p>
            ) : (
              <ul className="divide-y">
                {reglements.map((r) => {
                  const Icon = MODE_ICONS[r.mode];
                  return (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Icon size={16} weight="duotone" className="text-muted-foreground" />
                        {MODE_LABELS[r.mode]}
                        <span className="text-muted-foreground">· {formatDate(r.date_reglement)}</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatCurrency(r.montant)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <EncaissementDialog
        open={encaisserOuvert}
        onOpenChange={setEncaisserOuvert}
        titre="Encaisser la réparation"
        description={`${objet} — ${proprietaire}`}
        type="reparation"
        sens="entrant"
        reparationId={reparation.id}
        clientId={reparation.client_id}
        montantSuggere={resteDu > 0 ? resteDu : null}
        onEnregistre={() => setEncaisserOuvert(false)}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
