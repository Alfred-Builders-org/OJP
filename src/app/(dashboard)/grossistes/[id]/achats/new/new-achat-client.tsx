"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Diamond,
  FloppyDisk,
  Plus,
  Receipt,
  Trash,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { formatCurrency, formatDateISO } from "@/lib/format";
import { METAL_STOCK_OPTIONS, QUALITE_OPTIONS } from "@/lib/validations/lot";
import type { Grossiste, LigneAchatGrossiste } from "@/types/grossiste";

const AUCUNE_VALEUR = "—";
const SANS_TVA = "sans";

/**
 * Les taux qu'une facture de grossiste peut porter. « Sans TVA » n'est pas un
 * taux a zero : c'est un achat qui n'en portait aucune — grossiste non
 * assujetti, ou qui vend lui-meme sous le regime de la marge. L'article reste
 * alors revendable sous ce regime, alors qu'une facture avec TVA l'en sort.
 */
const TAUX_TVA_OPTIONS = [
  { value: "20", label: "20 %" },
  { value: "10", label: "10 %" },
  { value: "5.5", label: "5,5 %" },
  { value: "2.1", label: "2,1 %" },
] as const;

function ligneVide(): LigneAchatGrossiste {
  return {
    id: crypto.randomUUID(),
    designation: "",
    reference_fournisseur: "",
    metal: "",
    qualite: "",
    poids: "",
    quantite: "1",
    prix_achat: "",
    tva_taux: "20",
    prix_revente: "",
  };
}

/** Accepte la virgule decimale : c'est ainsi qu'on saisit un poids en France. */
function nombre(valeur: string): number | null {
  const brut = valeur.trim().replace(",", ".");
  if (!brut) return null;
  const n = Number(brut);
  return Number.isFinite(n) ? n : null;
}

export function NewAchatClient({ grossiste }: { grossiste: Grossiste }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [dateAchat, setDateAchat] = useState(formatDateISO(new Date()));
  const [numeroFacture, setNumeroFacture] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneAchatGrossiste[]>([ligneVide()]);

  function updateLigne(id: string, champ: keyof LigneAchatGrossiste, valeur: string) {
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l))
    );
  }

  function retirerLigne(id: string) {
    setLignes((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  /** La ventilation d'une ligne, telle qu'elle partira en base. */
  function ventilation(l: LigneAchatGrossiste) {
    const ht = nombre(l.prix_achat) ?? 0;
    const qte = nombre(l.quantite) ?? 1;
    const taux = l.tva_taux === SANS_TVA ? null : nombre(l.tva_taux);
    const tva = taux ? Math.round(ht * (taux / 100) * 100) / 100 : 0;
    return { ht, qte, taux, tva, ttc: Math.round((ht + tva) * 100) / 100 };
  }

  const totaux = lignes.reduce(
    (acc, l) => {
      const { ht, qte, tva, ttc } = ventilation(l);
      return {
        ht: acc.ht + ht * qte,
        tva: acc.tva + tva * qte,
        ttc: acc.ttc + ttc * qte,
      };
    },
    { ht: 0, tva: 0, ttc: 0 }
  );

  /**
   * Un article achete sans TVA reste revendable sous le regime de la marge :
   * autant le dire ici, c'est la seule fois ou l'information se saisit.
   */
  const nbSousMarge = lignes.filter(
    (l) => l.designation.trim() && l.tva_taux === SANS_TVA
  ).length;

  const totalRevente = lignes.reduce((sum, l) => {
    const prix = nombre(l.prix_revente) ?? 0;
    const qte = nombre(l.quantite) ?? 1;
    return sum + prix * qte;
  }, 0);

  async function handleCreate() {
    const remplies = lignes.filter((l) => l.designation.trim());
    if (remplies.length === 0) {
      setError("Ajoutez au moins un article, avec sa désignation.");
      return;
    }
    const sansPrix = remplies.find((l) => nombre(l.prix_achat) === null);
    if (sansPrix) {
      setError(`Le prix d'achat manque sur « ${sansPrix.designation} ».`);
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: achat, error: achatError } = await supabase
      .from("achats_grossiste")
      .insert({
        grossiste_id: grossiste.id,
        date_achat: dateAchat,
        numero_facture: numeroFacture || null,
        notes: notes || null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (achatError || !achat) {
      setSaving(false);
      setError(achatError?.message ?? "L'achat n'a pas pu être créé.");
      return;
    }

    // Les articles achetes chez un grossiste sont neufs : ils entrent en stock
    // boutique, sans passer par un dossier ni un delai de retractation.
    const articles = remplies.map((l) => {
      const poids = nombre(l.poids);
      const { ht, taux, tva, ttc } = ventilation(l);
      return {
        nom: l.designation.trim(),
        statut: "en_stock",
        metaux: l.metal || null,
        qualite: l.qualite || null,
        poids,
        poids_brut: poids,
        poids_net: poids,
        quantite: nombre(l.quantite) ?? 1,
        // prix_achat porte le cout reel, TVA comprise ; la ventilation vit a cote.
        prix_achat: ttc,
        prix_achat_ht: ht,
        tva_achat_taux: taux,
        tva_achat_montant: tva,
        // Une facture qui porte la TVA sort l'article du regime de la marge :
        // sa revente sera taxee sur le prix entier, et cette TVA-ci se deduit.
        regime_tva_revente: taux ? "normal" : "marge",
        prix_revente: nombre(l.prix_revente),
        grossiste_id: grossiste.id,
        achat_grossiste_id: achat.id,
        reference_fournisseur: l.reference_fournisseur.trim() || null,
      };
    });

    const { error: stockError } = await supabase
      .from("bijoux_stock")
      .insert(articles);

    setSaving(false);

    if (stockError) {
      // L'achat existe deja : le supprimer evite de laisser une coquille vide.
      await supabase.from("achats_grossiste").delete().eq("id", achat.id);
      setError(stockError.message);
      return;
    }

    router.push(`/achats/${achat.id}`);
  }

  return (
    <>
      <Header
        title={`Achat chez ${grossiste.nom}`}
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
        <Button size="sm" disabled={saving} onClick={handleCreate}>
          <FloppyDisk size={16} weight="duotone" />
          {saving ? "Enregistrement..." : "Enregistrer et mettre en stock"}
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && <FieldError>{error}</FieldError>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt size={20} weight="duotone" />
              L&apos;achat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label required>Date de l&apos;achat</Label>
                <Input
                  type="date"
                  value={dateAchat}
                  onChange={(e) => setDateAchat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>N° de facture</Label>
                <Input
                  value={numeroFacture}
                  onChange={(e) => setNumeroFacture(e.target.value)}
                  placeholder="F-2026-118"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Livraison partielle, reliquat à venir..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Diamond size={20} weight="duotone" />
              Articles ({lignes.length})
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLignes((prev) => [...prev, ligneVide()])}
            >
              <Plus size={14} weight="bold" />
              Ajouter un article
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="rounded-md border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    Article {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Retirer cet article"
                    disabled={lignes.length === 1}
                    onClick={() => retirerLigne(ligne.id)}
                  >
                    <Trash size={14} weight="duotone" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label required>Désignation</Label>
                    <Input
                      value={ligne.designation}
                      onChange={(e) =>
                        updateLigne(ligne.id, "designation", e.target.value)
                      }
                      placeholder="Bracelet jonc argent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Référence du grossiste</Label>
                    <Input
                      value={ligne.reference_fournisseur}
                      onChange={(e) =>
                        updateLigne(ligne.id, "reference_fournisseur", e.target.value)
                      }
                      placeholder="BBR2018"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Métal</Label>
                    <Select
                      value={ligne.metal || AUCUNE_VALEUR}
                      onValueChange={(v) =>
                        updateLigne(ligne.id, "metal", !v || v === AUCUNE_VALEUR ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUCUNE_VALEUR}>Non renseigné</SelectItem>
                        {METAL_STOCK_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Titre</Label>
                    <Select
                      value={ligne.qualite || AUCUNE_VALEUR}
                      onValueChange={(v) =>
                        updateLigne(ligne.id, "qualite", !v || v === AUCUNE_VALEUR ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUCUNE_VALEUR}>Non renseigné</SelectItem>
                        {QUALITE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Poids (g)</Label>
                    <Input
                      inputMode="decimal"
                      value={ligne.poids}
                      onChange={(e) => updateLigne(ligne.id, "poids", e.target.value)}
                      placeholder="4,25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantité</Label>
                    <Input
                      inputMode="numeric"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(ligne.id, "quantite", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label required>Prix d&apos;achat HT (€)</Label>
                    <Input
                      inputMode="decimal"
                      value={ligne.prix_achat}
                      onChange={(e) =>
                        updateLigne(ligne.id, "prix_achat", e.target.value)
                      }
                      placeholder="38,50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>TVA</Label>
                    <Select
                      value={ligne.tva_taux}
                      onValueChange={(v) =>
                        updateLigne(ligne.id, "tva_taux", v || SANS_TVA)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAUX_TVA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={SANS_TVA}>Sans TVA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prix d&apos;achat TTC</Label>
                    <p className="flex h-9 items-center text-sm tabular-nums">
                      {formatCurrency(ventilation(ligne).ttc)}
                      {ventilation(ligne).tva > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          dont {formatCurrency(ventilation(ligne).tva)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prix de revente (€)</Label>
                    <Input
                      inputMode="decimal"
                      value={ligne.prix_revente}
                      onChange={(e) =>
                        updateLigne(ligne.id, "prix_revente", e.target.value)
                      }
                      placeholder="96,60"
                    />
                  </div>
                </div>

                {ligne.tva_taux === SANS_TVA && (
                  <p className="text-xs text-muted-foreground">
                    Facture sans TVA : cet article se revendra sous le régime de
                    la marge (art. 297 A du CGI).
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total HT</span>
              <span className="tabular-nums">{formatCurrency(totaux.ht)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TVA déductible</span>
              <span className="tabular-nums">{formatCurrency(totaux.tva)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Total TTC</span>
              <span className="text-lg font-bold">{formatCurrency(totaux.ttc)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-muted-foreground">Valeur de revente</span>
              <span className="text-lg font-bold">{formatCurrency(totalRevente)}</span>
            </div>
            {nbSousMarge > 0 && (
              <p className="pt-2 text-xs text-muted-foreground">
                {nbSousMarge === 1
                  ? "1 article sans TVA à l'achat : il se revendra sous le régime de la marge."
                  : `${nbSousMarge} articles sans TVA à l'achat : ils se revendront sous le régime de la marge.`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
