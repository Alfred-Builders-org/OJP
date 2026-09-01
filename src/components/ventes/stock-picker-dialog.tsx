"use client";

import { FieldError } from "@/components/ui/field";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FloppyDisk,
  X,
  Diamond,
  MagnifyingGlass,
  Check,
  CaretUpDown,
  CurrencyEur,
  Receipt,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  MENTION_TVA_MARGE,
  calculerTaxeVente,
} from "@/lib/calculations/taxes";
import { formatCurrency } from "@/lib/format";
import type { BijouxStock, Reparation } from "@/types/bijoux";

interface StockPickerFormProps {
  lotId: string;
  onClose: () => void;
  excludeIds?: string[];
  editData?: import("@/types/vente").VenteLigne;
}

export function StockPickerForm({
  lotId,
  onClose,
  excludeIds = [],
  editData,
}: StockPickerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [stockItems, setStockItems] = useState<BijouxStock[]>([]);
  const [reparationsMap, setReparationsMap] = useState<Record<string, Reparation[]>>({});
  const [loading, setLoading] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const isEdit = !!editData;
  const [selectedId, setSelectedId] = useState(editData?.bijoux_stock_id ?? "");
  // Renoncer au regime de la marge : la TVA porte alors sur le prix entier.
  // Cela n'a d'interet que si le client est un professionnel qui la recupere.
  const [optionPrixTotal, setOptionPrixTotal] = useState(
    editData?.option_tva_prix_total ?? false
  );

  useEffect(() => {
    async function fetchStock() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("bijoux_stock")
        .select("*")
        .in("statut", ["en_stock", "en_depot_vente"])
        .order("created_at", { ascending: false });

      let items = (data ?? []) as BijouxStock[];
      // In edit mode, also include the currently assigned stock item
      if (editData?.bijoux_stock_id) {
        const { data: editItem } = await supabase
          .from("bijoux_stock")
          .select("*")
          .eq("id", editData.bijoux_stock_id)
          .single();
        if (editItem && !items.find((i) => i.id === editItem.id)) {
          items = [editItem as BijouxStock, ...items];
        }
      }
      const filteredItems = items.filter((item) => !excludeIds.includes(item.id));
      setStockItems(filteredItems);

      // Load completed repairs for all stock items to include repair costs in price
      if (filteredItems.length > 0) {
        const ids = filteredItems.map((i) => i.id);
        const { data: reps } = await supabase
          .from("reparations")
          .select("*")
          .in("bijou_id", ids)
          .eq("statut", "terminee");
        const map: Record<string, Reparation[]> = {};
        for (const rep of (reps ?? []) as Reparation[]) {
          if (!map[rep.bijou_id]) map[rep.bijou_id] = [];
          map[rep.bijou_id].push(rep);
        }
        setReparationsMap(map);
      }

      setLoading(false);
    }

    fetchStock();
  }, [excludeIds]);

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch) return stockItems;
    const q = catalogSearch.toLowerCase();
    return stockItems.filter(
      (item) =>
        item.nom.toLowerCase().includes(q) ||
        (item.metaux ?? "").toLowerCase().includes(q) ||
        (item.qualite ?? "").toLowerCase().includes(q)
    );
  }, [stockItems, catalogSearch]);

  const selectedItem = stockItems.find((item) => item.id === selectedId);

  // Sum completed repair costs for the selected item
  const coutReparation = useMemo(() => {
    if (!selectedItem) return 0;
    const reps = reparationsMap[selectedItem.id] ?? [];
    return reps.reduce((sum, r) => sum + (r.cout_reel ?? 0), 0);
  }, [selectedItem, reparationsMap]);

  const isDepotVente = !!selectedItem?.depot_vente_lot_id;
  const prixBase = selectedItem?.prix_revente ?? 0;
  const prixAchatOrigine = selectedItem?.prix_achat ?? 0;
  // Les frais de remise en etat gonflent le prix demande au client, jamais le
  // prix d'achat : ils n'entrent pas dans le calcul de la marge. Leur propre TVA
  // se recupere a part, sur la facture du reparateur.
  const prixVente = Math.round((prixBase + coutReparation) * 100) / 100;

  // Le regime ne depend pas du bijou, mais de qui l'a vendu a la boutique.
  //
  // Rachete a un particulier — ou depose par lui : la boutique revend un bien
  // d'occasion, donc TVA sur la seule marge (art. 297 A du CGI). Le prix d'achat
  // de reference est celui de la quittance ; pour un depot-vente, le net verse
  // au deposant. Le depot-vente portait auparavant la taxe forfaitaire sur cette
  // facture : c'etait deux erreurs a la fois, elle est due par le vendeur
  // particulier et se retient sur sa quittance, et elle portait sur le prix
  // entier au lieu de la marge.
  //
  // Achete a un grossiste assujetti qui a facture sa TVA : le bien n'a jamais
  // releve de la marge, sa revente est taxee sur le prix total.
  const regimeArticle = selectedItem?.regime_tva_revente ?? "marge";
  const taxe = calculerTaxeVente({
    prixVenteTTC: prixVente,
    prixAchat: prixAchatOrigine,
    regimeArticle,
    optionPrixTotal,
  });
  const montantTaxe = taxe.montantTVA;
  const taxeApplicable = montantTaxe > 0;
  const taxeLabel =
    taxe.regime === "marge"
      ? "TVA sur marge (art. 297 A du CGI)"
      : "TVA sur le prix total (20 %)";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedItem) {
      setError("Veuillez sélectionner un bijoux du stock.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      bijoux_stock_id: selectedItem.id,
      designation: selectedItem.nom,
      metal: selectedItem.metaux,
      qualite: selectedItem.qualite,
      poids: selectedItem.poids_net ?? selectedItem.poids,
      poids_brut: selectedItem.poids_brut,
      poids_net: selectedItem.poids_net,
      quantite: 1,
      prix_unitaire: prixVente,
      prix_total: prixVente,
      taxe_applicable: taxeApplicable,
      montant_taxe: montantTaxe,
      type_taxe: taxe.typeTaxe,
      taux_tva: taxe.taux,
      // Fige le prix d'achat : le registre de marge s'y adosse, et une
      // correction ulterieure de la fiche stock ne doit pas le deplacer.
      prix_achat_origine: prixAchatOrigine,
      option_tva_prix_total: optionPrixTotal,
      cout_reparation: coutReparation,
    };

    if (isEdit) {
      // Revert old stock item to its original status
      if (editData.bijoux_stock_id && editData.bijoux_stock_id !== selectedItem.id) {
        const oldItem = stockItems.find((i) => i.id === editData.bijoux_stock_id);
        const revertStatus = oldItem?.depot_vente_lot_id ? "en_depot_vente" : "en_stock";
        await supabase
          .from("bijoux_stock")
          .update({ statut: revertStatus })
          .eq("id", editData.bijoux_stock_id);
      }

      const { error: dbError } = await supabase
        .from("vente_lignes")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editData.id);

      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: dbError } = await supabase
        .from("vente_lignes")
        .insert({ ...payload, lot_id: lotId });

      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }
    }

    // Mark new stock as reserved
    await supabase
      .from("bijoux_stock")
      .update({ statut: "reserve" })
      .eq("id", selectedItem.id);

    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Card className="border-border bg-white dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Diamond size={16} weight="duotone" />
          {isEdit ? `Modifier — ${editData.designation}` : "Ajouter un bijoux du stock"}
        </CardTitle>
        <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Fermer">
          <X size={14} weight="regular" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FieldError>{error}</FieldError>}

          <div className="space-y-2">
            <Label>Bijoux</Label>
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
                    ? `${selectedItem.nom} — ${selectedItem.metaux ?? ""} ${selectedItem.qualite ?? ""} (${selectedItem.poids_net ?? selectedItem.poids ?? 0}g)`
                    : "Rechercher dans le stock..."}
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
                      Aucun bijoux disponible.
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
                          <span className="font-medium">{item.nom}</span>
                          {item.depot_vente_lot_id && (
                            <span className="ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                              Dépôt
                            </span>
                          )}
                          <span className="text-muted-foreground ml-1.5">
                            — {item.metaux ?? "?"} {item.qualite ?? ""} ({item.poids_net ?? item.poids ?? 0}g)
                            {item.prix_revente ? ` — ${formatCurrency(item.prix_revente)}` : ""}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Price + Tax display */}
          {selectedItem && (
            <div className="space-y-3">
              {coutReparation > 0 && (
                <p className="text-xs text-muted-foreground">
                  Prix de base {formatCurrency(prixBase)} + reparation {formatCurrency(coutReparation)}
                </p>
              )}
              <div className={`grid gap-3 ${taxeApplicable ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded-lg bg-secondary text-secondary-foreground p-3 space-y-1">
                  <p className="text-xs text-secondary-foreground/70 flex items-center gap-1">
                    <CurrencyEur size={12} weight="duotone" />
                    Prix de vente
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrency(prixVente)}
                  </p>
                </div>
                {taxeApplicable && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Receipt size={12} weight="duotone" />
                      {taxeLabel}
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(montantTaxe)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {taxe.regime === "marge"
                        ? `Marge : ${formatCurrency(taxe.base)}${isDepotVente ? " (sur le net déposant)" : ""}`
                        : "Comprise dans le prix affiché, et récupérable par le client"}
                    </p>
                  </div>
                )}
              </div>

              {/* Le prix demande au client ne bouge pas : c'est celui de
                  l'etiquette. Le regime ne change que ce que la boutique
                  reverse, et ce que la facture montre. */}
              {regimeArticle === "marge" ? (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      className="mt-0.5"
                      checked={optionPrixTotal}
                      onCheckedChange={(v) => setOptionPrixTotal(!!v)}
                    />
                    <span>
                      Facturer la TVA sur le prix total
                      <span className="block text-xs text-muted-foreground">
                        Renonce au régime de la marge pour cette vente. À ne
                        cocher que si le client est un professionnel qui veut
                        récupérer la TVA — la boutique y perd.
                      </span>
                    </span>
                  </label>
                  {!optionPrixTotal && (
                    <p className="text-xs text-muted-foreground">
                      {MENTION_TVA_MARGE}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Article acheté avec TVA à un professionnel : sa revente est
                  taxée sur le prix total, et la TVA figure sur la facture.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving || !selectedItem}>
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
