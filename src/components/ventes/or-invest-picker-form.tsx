"use client";

import { FieldError } from "@/components/ui/field";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FloppyDisk,
  X,
  Coins,
  MagnifyingGlass,
  Check,
  CaretUpDown,
  CurrencyEur,
  Receipt,
  Wallet,
  Warning,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/format";
import { calculerPrixRachatOrInvest } from "@/lib/calculations/prix-rachat";
import type { OrInvestissement } from "@/types/or-investissement";

interface OrInvestPickerFormProps {
  lotId: string;
  onClose: () => void;
  coursOrSnapshot: number;
  coursArgentSnapshot: number;
  coefficientVenteSnapshot: number;
}

export function OrInvestPickerForm({ lotId, onClose, coursOrSnapshot, coursArgentSnapshot, coefficientVenteSnapshot }: OrInvestPickerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [catalog, setCatalog] = useState<OrInvestissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [quantite, setQuantite] = useState("1");
  // Vide : le prix suit le calcul. Rempli : la boutique a negocie.
  const [prixSaisi, setPrixSaisi] = useState("");
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("or_investissement")
        .select("*")
        .order("designation", { ascending: true });

      setCatalog((data ?? []) as OrInvestissement[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  function getCoursForMetal(metal: string | null): number {
    if (!metal) return 0;
    if (metal === "Or") return coursOrSnapshot;
    if (metal === "Argent") return coursArgentSnapshot;
    return 0;
  }

  // Le coefficient propre a la piece prime sur celui des parametres : un
  // napoleon et un lingot n'ont ni la meme prime ni la meme liquidite. La fiche
  // du catalogue applique deja cette regle ; sans elle ici, l'ecran de vente
  // affichait un prix different de celui de la fiche.
  function calculerPrixVente(item: OrInvestissement): number {
    const cours = getCoursForMetal(item.metal);
    const titre = item.titre ? parseFloat(item.titre) : 0;
    const coefficient = item.coefficient_vente ?? coefficientVenteSnapshot;
    return calculerPrixRachatOrInvest(cours, titre, item.poids ?? 0, coefficient);
  }

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch) return catalog;
    const q = catalogSearch.toLowerCase();
    return catalog.filter(
      (item) =>
        item.designation.toLowerCase().includes(q) ||
        (item.metal ?? "").toLowerCase().includes(q) ||
        (item.pays ?? "").toLowerCase().includes(q)
    );
  }, [catalog, catalogSearch]);

  const selectedItem = catalog.find((item) => item.id === selectedId);
  const qty = parseInt(quantite) || 1;

  // Le prix calcule reste la reference : c'est lui qui s'affiche a la selection
  // d'un produit, et lui qu'on retrouve en vidant le champ.
  const prixTheorique = selectedItem ? calculerPrixVente(selectedItem) : 0;
  const prixUnitaire = prixSaisi.trim() !== "" ? parseFloat(prixSaisi.replace(",", ".")) || 0 : prixTheorique;
  const prixTotal = Math.round(prixUnitaire * qty * 100) / 100;

  // Un prix negocie n'est pas suspect en soi — une piece abimee part moins
  // cher, un bon cadeau n'a aucun cours. Passer sous la valeur du metal, en
  // revanche, merite d'etre vu avant de valider : c'est la que se logent les
  // fautes de frappe.
  const prixNegocie = prixSaisi.trim() !== "" && Math.abs(prixUnitaire - prixTheorique) > 0.005;
  const sousLeCours = prixNegocie && prixTheorique > 0 && prixUnitaire < prixTheorique;
  const ecart = prixTheorique > 0 ? ((prixUnitaire - prixTheorique) / prixTheorique) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedItem) {
      setError("Veuillez sélectionner un produit du catalogue.");
      return;
    }

    if (qty < 1) {
      setError("La quantité doit être au moins 1.");
      return;
    }

    if (prixUnitaire < 0) {
      setError("Le prix ne peut pas être négatif.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: dbError } = await supabase.from("vente_lignes").insert({
      lot_id: lotId,
      or_investissement_id: selectedItem.id,
      bijoux_stock_id: null,
      designation: selectedItem.designation,
      metal: selectedItem.metal,
      qualite: selectedItem.titre,
      poids: selectedItem.poids,
      quantite: qty,
      prix_unitaire: prixUnitaire,
      prix_total: prixTotal,
      // Ce que la formule disait, garde a cote de ce qui a ete pratique : sans
      // lui, plus rien ne distingue une remise consentie d'une faute de frappe.
      prix_theorique: prixNegocie ? prixTheorique : null,
      taxe_applicable: false,
      montant_taxe: 0,
      fulfillment: "pending",
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Card className="border-border bg-white dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Coins size={16} weight="duotone" />
          Ajouter un or investissement
        </CardTitle>
        <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Fermer">
          <X size={14} weight="regular" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FieldError>{error}</FieldError>}

          <div className="space-y-2">
            <Label>Produit</Label>
            <Popover open={catalogOpen} onOpenChange={setCatalogOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    type="button"
                  />
                }
              >
                <span className={selectedItem ? "text-foreground" : "text-muted-foreground"}>
                  {selectedItem
                    ? `${selectedItem.designation} — ${selectedItem.metal ?? ""} (${selectedItem.poids ?? 0}g)`
                    : "Rechercher dans le catalogue..."}
                </span>
                <CaretUpDown size={14} weight="regular" className="text-muted-foreground shrink-0" />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <MagnifyingGlass
                      size={14}
                      weight="regular"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Rechercher..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chargement...
                    </p>
                  ) : filteredCatalog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun produit trouvé.
                    </p>
                  ) : (
                    filteredCatalog.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer text-left"
                        onClick={() => {
                          setSelectedId(item.id);
                          setCatalogOpen(false);
                          setCatalogSearch("");
                        }}
                      >
                        <Check
                          size={14}
                          weight="bold"
                          className={selectedId === item.id ? "text-primary" : "opacity-0"}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.designation}</span>
                          <span className="text-muted-foreground ml-1.5">
                            — {item.metal ?? "?"} ({item.poids ?? 0}g)
                          </span>
                          {(() => { const p = calculerPrixVente(item); return p > 0 ? (
                            <span className="text-muted-foreground ml-1.5">— {formatCurrency(p)}</span>
                          ) : null; })()}
                          <span className={`ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium ${item.quantite > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                            Stock : {item.quantite}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantite_or">Quantité</Label>
              <Input
                id="quantite_or"
                type="number"
                step="1"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix_or">Prix unitaire</Label>
              <Input
                id="prix_or"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={prixSaisi}
                placeholder={prixTheorique ? prixTheorique.toFixed(2) : "—"}
                onChange={(e) => setPrixSaisi(e.target.value)}
                disabled={!selectedItem}
              />
            </div>
          </div>

          {/* Le prix se negocie au comptoir. On dit ce que valait le calcul, et
              de combien on s'en ecarte — dans une boite d'alerte pour que ca se
              voie, sans jamais l'interdire. */}
          {selectedItem && prixNegocie && (
            <div
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
                sousLeCours
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Warning size={16} weight="duotone" className="mt-0.5 shrink-0" />
              <span>
                Prix calculé : <b>{formatCurrency(prixTheorique)}</b> — écart de{" "}
                {ecart > 0 ? "+" : ""}
                {ecart.toFixed(1)} %
                {sousLeCours && prixTheorique > 0 && ecart < -20
                  ? " — bien en dessous de la valeur du métal, à vérifier."
                  : ""}
              </span>
            </div>
          )}

          {/* Meme grille recapitulative que le rachat de bijoux : prix, taxe,
              net. L'or d'investissement est exonere, la tuile taxe le dit. */}
          {selectedItem && prixTotal > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CurrencyEur size={12} weight="duotone" />
                  Prix total
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(prixTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {qty} × {formatCurrency(prixUnitaire)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Receipt size={12} weight="duotone" />
                  Taxe
                </p>
                <p className="text-sm font-medium">Exonéré</p>
                <p className="text-xs text-muted-foreground">
                  Or d&apos;investissement (art. 298 sexdecies A)
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wallet size={12} weight="duotone" />
                  Net à encaisser
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {formatCurrency(prixTotal)}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving || !selectedItem}>
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
