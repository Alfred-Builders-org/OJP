"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Receipt, FloppyDisk, Info } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BonCommande } from "@/types/bon-commande";
import type { VenteLigne } from "@/types/vente";
import type { Reglement } from "@/types/reglement";

/** L'ancre du bloc : les actions en attente y renvoient. */
export const DEVIS_FONDERIE_ANCHOR = "devis-fonderie";

interface DevisFonderieCardProps {
  bdc: BonCommande;
  lignes: VenteLigne[];
  reglements: Reglement[];
}

/** Un champ vide vaut « pas encore chiffré », pas zéro. */
function toNumber(saisie: string): number | null {
  const trim = saisie.trim();
  if (trim === "") return null;
  const n = Number(trim.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toInput(valeur: number | null | undefined): string {
  return valeur === null || valeur === undefined ? "" : String(valeur);
}

/**
 * Le devis que la fonderie renvoie après l'envoi de la commande : un prix par
 * article, et ce qu'elle facture en plus. C'est cette somme qu'on lui règle —
 * le prix du catalogue est celui auquel on revend, il n'a rien à faire ici.
 */
export function DevisFonderieCard({ bdc, lignes, reglements }: DevisFonderieCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [prix, setPrix] = useState<Record<string, string>>(() =>
    Object.fromEntries(lignes.map((l) => [l.id, toInput(l.prix_achat_fonderie)])),
  );
  const [fraisMontant, setFraisMontant] = useState(() =>
    bdc.frais_annexes ? String(bdc.frais_annexes) : "",
  );
  const [fraisLibelle, setFraisLibelle] = useState(bdc.frais_annexes_libelle ?? "");

  const enAttenteDEnvoi = bdc.statut === "brouillon";
  const verrouille = bdc.statut === "annule";

  const totalArticles = useMemo(
    () =>
      lignes.reduce(
        (somme, l) => somme + (toNumber(prix[l.id] ?? "") ?? 0) * l.quantite,
        0,
      ),
    [lignes, prix],
  );
  const frais = toNumber(fraisMontant) ?? 0;
  const totalDevis = Math.round((totalArticles + frais) * 100) / 100;

  const dejaPaye = reglements.reduce((somme, r) => somme + r.montant, 0);
  const restant = Math.round(Math.max(0, totalDevis - dejaPaye) * 100) / 100;

  const modifie =
    lignes.some((l) => (prix[l.id] ?? "") !== toInput(l.prix_achat_fonderie)) ||
    frais !== (bdc.frais_annexes ?? 0) ||
    fraisLibelle.trim() !== (bdc.frais_annexes_libelle ?? "");

  const devisSaisi = bdc.montant_fonderie > 0;

  async function handleSave() {
    setSaving(true);

    for (const ligne of lignes) {
      const saisi = toNumber(prix[ligne.id] ?? "");
      if (saisi === (ligne.prix_achat_fonderie ?? null)) continue;
      const { error } = await supabase
        .from("vente_lignes")
        .update({ prix_achat_fonderie: saisi })
        .eq("id", ligne.id);
      if (error) {
        setSaving(false);
        toast.error("Erreur lors de l'enregistrement du devis");
        return;
      }
    }

    const libelle = fraisLibelle.trim();
    if (frais !== (bdc.frais_annexes ?? 0) || libelle !== (bdc.frais_annexes_libelle ?? "")) {
      const { error } = await supabase
        .from("bons_commande")
        .update({ frais_annexes: frais, frais_annexes_libelle: libelle || null })
        .eq("id", bdc.id);
      if (error) {
        setSaving(false);
        toast.error("Erreur lors de l'enregistrement des frais annexes");
        return;
      }
    }

    setSaving(false);
    toast.success("Devis fonderie enregistré");
    router.refresh();
  }

  return (
    <Card id={DEVIS_FONDERIE_ANCHOR} className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt size={20} weight="duotone" />
          Devis fonderie
          {!enAttenteDEnvoi && (
            <Badge
              variant="secondary"
              className={
                devisSaisi
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }
            >
              {devisSaisi ? "Saisi" : "À saisir"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {enAttenteDEnvoi ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            <Info size={18} weight="duotone" className="shrink-0" />
            La fonderie renvoie son devis chiffré une fois la commande envoyée.
            Les prix se saisiront ici à ce moment-là.
          </div>
        ) : (
          <>
            {lignes.map((ligne) => {
              const unitaire = toNumber(prix[ligne.id] ?? "");
              return (
                <div
                  key={ligne.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{ligne.designation}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {ligne.metal && <span>{ligne.metal}</span>}
                      {ligne.poids && <span>· {ligne.poids}g</span>}
                      <span>· ×{ligne.quantite}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className="w-28 text-right"
                        placeholder="0,00"
                        aria-label={`Prix unitaire fonderie — ${ligne.designation}`}
                        disabled={verrouille || saving}
                        value={prix[ligne.id] ?? ""}
                        onChange={(e) =>
                          setPrix((prev) => ({ ...prev, [ligne.id]: e.target.value }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">€/u</span>
                    </div>
                    <span className="w-24 text-right text-sm font-bold">
                      {unitaire === null ? "—" : formatCurrency(unitaire * ligne.quantite)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Frais annexes — port, assurance, façon : hors prix des articles */}
            <div className="rounded-lg border px-4 py-3 space-y-2">
              <Label className="text-sm">Frais annexes</Label>
              <div className="flex items-center gap-3">
                <Input
                  className="flex-1"
                  placeholder="Port, assurance..."
                  aria-label="Libellé des frais annexes"
                  disabled={verrouille || saving}
                  value={fraisLibelle}
                  onChange={(e) => setFraisLibelle(e.target.value)}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    className="w-28 text-right"
                    placeholder="0,00"
                    aria-label="Montant des frais annexes"
                    disabled={verrouille || saving}
                    value={fraisMontant}
                    onChange={(e) => setFraisMontant(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">€</span>
                </div>
              </div>
            </div>

            {/* Récapitulatif du règlement */}
            <div className="rounded-lg border bg-muted/50 px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Articles</span>
                <span className="font-medium">{formatCurrency(totalArticles)}</span>
              </div>
              {frais > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fraisLibelle.trim() || "Frais annexes"}
                  </span>
                  <span className="font-medium">{formatCurrency(frais)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
                <span className="font-semibold text-foreground">Total à payer</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(totalDevis)}
                </span>
              </div>
              {dejaPaye > 0 && (
                <div className="mt-3 space-y-1">
                  {reglements.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDate(r.date_reglement)} · {r.mode}
                      </span>
                      <span className="font-medium text-muted-foreground">
                        − {formatCurrency(r.montant)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Reste à payer</span>
                <span
                  className={`text-lg font-bold ${restant <= 0 && dejaPaye > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                >
                  {restant > 0 ? formatCurrency(restant) : dejaPaye > 0 ? "Soldé" : "—"}
                </span>
              </div>
            </div>

            {!verrouille && (
              <div className="flex justify-end">
                <Button size="sm" disabled={!modifie || saving} onClick={handleSave}>
                  <FloppyDisk size={14} weight="duotone" />
                  {saving ? "Enregistrement..." : "Enregistrer le devis"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
