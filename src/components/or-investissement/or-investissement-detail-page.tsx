"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info as PhInfo,
  Package as PhPackage,
  PencilSimple,
  FloppyDisk,
  Wrench,
  CurrencyEur,
  Tag,
  TrendUp,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { calculerPrixRachatOrInvest } from "@/lib/calculations/prix-rachat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDate, formatCurrency } from "@/lib/format";
import type { OrInvestissement } from "@/types/or-investissement";

function DetailRow({
  label,
  value,
  editing,
  editValue,
  onEditChange,
  type = "text",
  editContent,
}: {
  label: string;
  value: React.ReactNode;
  editing?: boolean;
  editValue?: string;
  onEditChange?: (val: string) => void;
  type?: string;
  editContent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {editing && editContent ? (
        editContent
      ) : editing && onEditChange ? (
        <Input
          type={type}
          value={editValue ?? ""}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-48"
        />
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

export function OrInvestissementDetailPage({ item, canEdit = true }: { item: OrInvestissement; canEdit?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [designation, setDesignation] = useState(item.designation);
  const [pays, setPays] = useState(item.pays ?? "");
  const [annees, setAnnees] = useState(item.annees ?? "");
  const [metal, setMetal] = useState(item.metal ?? "");
  const [titre, setTitre] = useState(item.titre ?? "");
  const [poids, setPoids] = useState(item.poids?.toString() ?? "");
  const [quantite, setQuantite] = useState(item.quantite.toString());
  // Vide : la piece suit les coefficients generaux des parametres.
  const [coeffAchatLocal, setCoeffAchatLocal] = useState(
    item.coefficient_achat?.toString() ?? ""
  );
  const [coeffVenteLocal, setCoeffVenteLocal] = useState(
    item.coefficient_vente?.toString() ?? ""
  );
  const [parametres, setParametres] = useState<{
    prix_or: number | null;
    prix_argent: number | null;
    prix_platine: number | null;
    coefficient_rachat: number | null;
    coefficient_vente: number | null;
  } | null>(null);

  useEffect(() => {
    async function fetchParametres() {
      const supabase = createClient();
      const { data } = await supabase.from("parametres").select("*").single();
      if (data) setParametres(data);
    }
    fetchParametres();
  }, []);

  function getCoursForMetal(metalType: string | null): number {
    if (!parametres || !metalType) return 0;
    if (metalType === "Or") return parametres.prix_or ?? 0;
    if (metalType === "Argent") return parametres.prix_argent ?? 0;
    if (metalType === "Platine") return parametres.prix_platine ?? 0;
    return 0;
  }

  const cours = getCoursForMetal(item.metal);
  const poidsNum = item.poids ?? 0;

  // Le coefficient de la piece prime sur celui des parametres. « General »
  // signale, plus bas, que la piece n'en a pas de propre.
  const coeffPropreAchat = item.coefficient_achat;
  const coeffPropreVente = item.coefficient_vente;
  const coeffRachat = coeffPropreAchat ?? parametres?.coefficient_rachat ?? 0;
  const coeffVente = coeffPropreVente ?? parametres?.coefficient_vente ?? 0;

  // Meme formule partout : cours x titre x poids x coefficient. Le poids du
  // catalogue est un poids BRUT — un napoleon y pese 6,45 g au titre 900, soit
  // 5,81 g d'or fin — donc le titre s'applique. La fiche, le formulaire de
  // rachat et celui de vente passent tous les trois par la meme fonction.
  const titreNum = item.titre ? parseFloat(item.titre) : 0;
  const prixRachat = calculerPrixRachatOrInvest(cours, titreNum, poidsNum, coeffRachat);
  const prixVente = calculerPrixRachatOrInvest(cours, titreNum, poidsNum, coeffVente);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("or_investissement")
      .update({
        designation,
        pays: pays || null,
        annees: annees || null,
        metal: metal || null,
        titre: titre || null,
        poids: poids ? parseFloat(poids) : null,
        quantite: quantite ? parseInt(quantite) : 0,
        coefficient_achat: coeffAchatLocal ? parseFloat(coeffAchatLocal) : null,
        coefficient_vente: coeffVenteLocal ? parseFloat(coeffVenteLocal) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <Header
        title={item.designation}
        backAction={
          <Button variant="ghost" size="icon-sm" aria-label="Retour" onClick={() => router.back()}>
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        {canEdit && (
          editing ? (
            <Button size="sm" disabled={saving} onClick={handleSave}>
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <PencilSimple size={16} weight="duotone" />
              Modifier
            </Button>
          )
        )}
      </Header>
      <div className="flex-1 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhInfo size={20} weight="duotone" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Désignation" value={item.designation} editing={editing} editValue={designation} onEditChange={setDesignation} />
              <DetailRow label="Pays" value={item.pays ?? "—"} editing={editing} editValue={pays} onEditChange={setPays} />
              <DetailRow label="Années" value={item.annees ?? "—"} editing={editing} editValue={annees} onEditChange={setAnnees} />
            </CardContent>
          </Card>

          {/* Caractéristiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench size={20} weight="duotone" />
                Caractéristiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Métal"
                value={item.metal ?? "—"}
                editing={editing}
                editContent={
                  <Select value={metal} onValueChange={(val) => setMetal(val ?? "")}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Or">Or</SelectItem>
                      <SelectItem value="Argent">Argent</SelectItem>
                      <SelectItem value="Autres">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              <DetailRow label="Titre" value={item.titre ?? "—"} editing={editing} editValue={titre} onEditChange={setTitre} />
              <DetailRow label="Poids" value={item.poids !== null ? `${item.poids} g` : "—"} editing={editing} editValue={poids} onEditChange={setPoids} type="number" />
            </CardContent>
          </Card>

          {/* Prix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyEur size={20} weight="duotone" />
                Prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Cours du métal" value={parametres ? `${formatCurrency(cours)}/g` : "Chargement..."} />
              <DetailRow
                label="Coefficient d'achat"
                value={
                  coeffPropreAchat != null
                    ? String(coeffPropreAchat)
                    : `${coeffRachat} (général)`
                }
                editing={editing}
                editValue={coeffAchatLocal}
                onEditChange={setCoeffAchatLocal}
                type="number"
              />
              <DetailRow
                label="Coefficient de vente"
                value={
                  coeffPropreVente != null
                    ? String(coeffPropreVente)
                    : `${coeffVente} (général)`
                }
                editing={editing}
                editValue={coeffVenteLocal}
                onEditChange={setCoeffVenteLocal}
                type="number"
              />
              {/* Le prix se lit d'un coup d'oeil : ce qu'on paie, ce qu'on
                  demande, ce qu'il reste — plutot qu'en trois lignes noyees
                  parmi les coefficients. La formule est rappelee dessous. */}
              {cours > 0 && poidsNum > 0 && titreNum > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CurrencyEur size={12} weight="duotone" />
                        Prix de rachat
                      </p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(prixRachat)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag size={12} weight="duotone" />
                        Prix de vente
                      </p>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(prixVente)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-3 space-y-1 dark:border-emerald-400/30 dark:bg-emerald-500/15">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <TrendUp size={12} weight="duotone" />
                        Marge
                      </p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(prixVente - prixRachat)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(cours)}/g × {titreNum}‰ × {poidsNum} g ×{" "}
                    {coeffRachat} (rachat) / {coeffVente} (vente)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhPackage size={20} weight="duotone" />
                Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Quantité" value={item.quantite} editing={editing} editValue={quantite} onEditChange={setQuantite} type="number" />
              <DetailRow label="Dernière modification" value={formatDate(item.updated_at)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
