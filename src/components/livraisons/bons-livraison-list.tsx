"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Factory,
  Diamond,
  Package,
  WarningCircle,
  Coins,
} from "@phosphor-icons/react";
import { CataloguePickerFonderie } from "@/components/livraisons/catalogue-picker-fonderie";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import {
  createBonsLivraison,
  articleDepuisStock,
  type ArticleAFondre,
} from "@/lib/fonderie/create-bon-livraison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { formatCurrency } from "@/lib/format";
import type { Fonderie } from "@/types/fonderie";
import type { BijouxStock } from "@/types/bijoux";

/**
 * Plafond de valeur d'un envoi en fonderie.
 *
 * Au-dela, un envoi n'est plus couvert : on constitue plusieurs paquets. C'est
 * la raison d'etre de la selection — composer des lots qui tiennent sous la
 * limite, plutot que de tout envoyer d'un bloc.
 */
const PLAFOND_ENVOI = 20_000;

interface BonsLivraisonListProps {
  fonderies: Fonderie[];
  /** Remonte le nombre d'articles en attente, pour le compteur de l'onglet. */
  onCountChange?: (count: number) => void;
}

export function BonsLivraisonList({ fonderies, onCountChange }: BonsLivraisonListProps) {
  const router = useRouter();
  const [stockItems, setStockItems] = useState<BijouxStock[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [generating, setGenerating] = useState(false);
  const [catalogueOuvert, setCatalogueOuvert] = useState(false);

  // Les articles a fondre s'accumulent et partent par fournees : on les
  // selectionne en lot plutot que de choisir une fonderie ligne par ligne.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fonderieLot, setFonderieLot] = useState("");
  const [choixFonderie, setChoixFonderie] = useState(false);

  // Build fonderie name map for Select display
  const fonderieNameMap = useMemo(
    () => Object.fromEntries(fonderies.map((f) => [f.id, f.nom])),
    [fonderies],
  );

  // Fetch only articles marked "a_fondre"
  useEffect(() => {
    async function fetchStock() {
      setLoadingStock(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("bijoux_stock")
        .select("*")
        .eq("statut", "a_fondre")
        .order("created_at", { ascending: false });
      setStockItems((data ?? []) as BijouxStock[]);
      setLoadingStock(false);
    }
    fetchStock();
  }, []);

  useEffect(() => {
    onCountChange?.(stockItems.length);
  }, [stockItems.length, onCountChange]);

  const filtered = useMemo(() => {
    if (!search) return stockItems;
    const q = search.toLowerCase();
    return stockItems.filter(
      (i) =>
        i.nom.toLowerCase().includes(q) ||
        (i.metaux ?? "").toLowerCase().includes(q) ||
        (i.qualite ?? "").toLowerCase().includes(q),
    );
  }, [stockItems, search]);

  const totalItems = filtered.length;
  const paginatedData = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const selection = useMemo(
    () => filtered.filter((i) => selectedIds.has(i.id)),
    [filtered, selectedIds],
  );
  const poidsSelection = selection.reduce(
    (sum, i) => sum + (i.poids_net ?? i.poids ?? 0),
    0,
  );
  const valeurSelection = selection.reduce(
    (sum, i) => sum + (i.prix_achat ?? 0) * (i.quantite ?? 1),
    0,
  );
  const plafondDepasse = valeurSelection > PLAFOND_ENVOI;
  const toutSelectionne = filtered.length > 0 && selection.length === filtered.length;

  function basculerLigne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function basculerTout() {
    setSelectedIds(toutSelectionne ? new Set() : new Set(filtered.map((i) => i.id)));
  }

  /** Envoie d'un coup tous les articles coches vers la meme fonderie. */
  async function handleEnvoyerSelection() {
    if (!fonderieLot || selection.length === 0 || plafondDepasse) return;
    setGenerating(true);
    setChoixFonderie(false);

    const groups = new Map<string, ArticleAFondre[]>([
      [fonderieLot, selection.map(articleDepuisStock)],
    ]);
    await createBonsLivraison({ groups, fonderies });

    const envoyes = new Set(selection.map((i) => i.id));
    setStockItems((prev) => prev.filter((i) => !envoyes.has(i.id)));
    setSelectedIds(new Set());
    setFonderieLot("");
    setGenerating(false);
    router.refresh();
  }

  // Track items being moved to stock
  const [movingToStock, setMovingToStock] = useState<Record<string, boolean>>({});

  async function handleGarderEnStock(itemId: string) {
    setMovingToStock((prev) => ({ ...prev, [itemId]: true }));
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("bijoux_stock").update({ statut: "en_stock" }).eq("id", itemId),
      "Erreur lors du passage en stock",
      "Article gardé en stock"
    );
    setMovingToStock((prev) => ({ ...prev, [itemId]: false }));
    if (error) return;
    setStockItems((prev) => prev.filter((i) => i.id !== itemId));
  }



  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
            className="pl-9"
          />
        </div>

        {/* Les lingots et pieces ne sont pas dans ce tableau : ce sont des
            compteurs, pas des articles uniques. Ils partent par leur propre
            ecran, ou l'on choisit une quantite. */}
        <Button variant="outline" size="sm" onClick={() => setCatalogueOuvert(true)}>
          <Coins size={16} weight="duotone" />
          Fondre des lingots ou des pièces
        </Button>
      </div>

      <CataloguePickerFonderie
        open={catalogueOuvert}
        onOpenChange={setCatalogueOuvert}
        fonderies={fonderies}
      />


      <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-white dark:bg-card">
        <Table className={paginatedData.length === 0 ? "h-full" : ""}>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="bg-transparent hover:bg-transparent">
              <TableHead className="w-[44px] pl-4">
                <Checkbox
                  checked={toutSelectionne}
                  onCheckedChange={basculerTout}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Métal / Titrage</TableHead>
              <TableHead className="text-right">Poids</TableHead>
              <TableHead className="text-right">Prix achat</TableHead>
              <TableHead className="w-[100px] pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingStock ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow className="hover:bg-transparent h-full">
                <TableCell colSpan={6} className="text-center align-middle text-muted-foreground">
                  <Diamond size={32} weight="duotone" className="mx-auto mb-2 opacity-40" />
                  Aucun article à envoyer en fonderie.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => {

                return (
                  <TableRow key={item.id} className="bg-white dark:bg-card">
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => basculerLigne(item.id)}
                        aria-label={`Sélectionner ${item.nom}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Diamond size={16} weight="duotone" className="text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{item.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {item.metaux && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{item.metaux}</Badge>
                        )}
                        {item.qualite && (
                          <span className="text-sm text-muted-foreground">{item.qualite}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {item.poids_net ? `${item.poids_net}g` : item.poids ? `${item.poids}g` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {item.prix_achat != null ? formatCurrency(item.prix_achat) : "—"}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        disabled={!!movingToStock[item.id]}
                        onClick={() => handleGarderEnStock(item.id)}
                      >
                        <Package size={14} weight="duotone" />
                        {movingToStock[item.id] ? "..." : "Stock"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="shrink-0">
        <DataTablePagination
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/*
        Le paquet en cours de composition. Flottant et centre, il suit le
        defilement : on coche des lignes en haut du tableau et on lit le poids
        et la valeur sans remonter.
      */}
      {selection.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div
            className={`pointer-events-auto flex flex-wrap items-center gap-x-6 gap-y-2 rounded-full border bg-background/95 px-5 py-3 shadow-lg ring-1 backdrop-blur ${
              plafondDepasse
                ? "border-destructive/40 ring-destructive/20"
                : "ring-foreground/10"
            }`}
          >
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tabular-nums">{selection.length}</span>
              <span className="text-xs text-muted-foreground">
                article{selection.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tabular-nums">
                {poidsSelection.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">g</span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-sm font-semibold tabular-nums ${plafondDepasse ? "text-destructive" : ""}`}
              >
                {formatCurrency(valeurSelection)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatCurrency(PLAFOND_ENVOI)}
              </span>
            </div>

            {plafondDepasse && (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <WarningCircle size={14} weight="duotone" />
                Retirez {formatCurrency(valeurSelection - PLAFOND_ENVOI)} pour rester
                sous le plafond
              </span>
            )}

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                disabled={generating || plafondDepasse}
                onClick={() => setChoixFonderie(true)}
              >
                <Factory size={14} weight="duotone" />
                Créer un lot d&apos;envoi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Le paquet est compose : reste a dire chez qui il part. */}
      <Dialog open={choixFonderie} onOpenChange={setChoixFonderie}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory size={20} weight="duotone" />
              Créer un lot d&apos;envoi
            </DialogTitle>
            <DialogDescription>
              {selection.length} article{selection.length > 1 ? "s" : ""} ·{" "}
              {poidsSelection.toFixed(2)} g · {formatCurrency(valeurSelection)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fonderie destinataire</label>
            <Select value={fonderieLot} onValueChange={(v) => { if (v) setFonderieLot(v); }}>
              <SelectTrigger>
                <Factory size={14} weight="duotone" />
                <span className="flex-1 text-left truncate">
                  {fonderieNameMap[fonderieLot] ?? "Choisir une fonderie"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {fonderies.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChoixFonderie(false)}>
              Annuler
            </Button>
            <Button
              disabled={generating || !fonderieLot}
              onClick={handleEnvoyerSelection}
            >
              <Factory size={14} weight="duotone" />
              {generating ? "Envoi..." : "Envoyer en fonderie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
