"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Factory, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatCurrency } from "@/lib/format";
import {
  createBonLivraison,
  articleDepuisCatalogue,
} from "@/lib/fonderie/create-bon-livraison";
import { calculerPrixRachatOrInvest } from "@/lib/calculations/prix-rachat";
import type { Fonderie } from "@/types/fonderie";
import type { OrInvestissement } from "@/types/or-investissement";

interface CataloguePickerFonderieProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fonderies: Fonderie[];
}

/**
 * Envoyer a la fonte des lingots ou des pieces du catalogue.
 *
 * Un produit d'investissement n'est pas une piece unique mais un compteur : on
 * choisit une quantite, pas une ligne. D'ou un ecran a part plutot qu'un onglet
 * de plus dans la liste des bijoux, dont chaque ligne vaut un objet.
 *
 * La valeur affichee est celle du METAL, sans coefficient : la prime d'une
 * piece ne survit pas a la fonte. Un napoleon fondu ne vaut plus que son or, et
 * c'est ce que la fonderie paiera.
 */
export function CataloguePickerFonderie({
  open,
  onOpenChange,
  fonderies,
}: CataloguePickerFonderieProps) {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState<OrInvestissement[]>([]);
  const [cours, setCours] = useState<Record<string, number>>({});
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [quantites, setQuantites] = useState<Record<string, string>>({});
  const [fonderieId, setFonderieId] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!open) return;
    let annule = false;

    async function charger() {
      setChargement(true);
      const supabase = createClient();
      const [{ data: produits }, { data: parametres }] = await Promise.all([
        supabase
          .from("or_investissement")
          .select("*")
          .gt("quantite", 0)
          .order("designation"),
        supabase
          .from("parametres")
          .select("prix_or, prix_argent, prix_platine")
          .eq("id", 1)
          .single(),
      ]);
      if (annule) return;
      setCatalogue((produits ?? []) as OrInvestissement[]);
      setCours({
        Or: parametres?.prix_or ?? 0,
        Argent: parametres?.prix_argent ?? 0,
        Platine: parametres?.prix_platine ?? 0,
      });
      setChargement(false);
    }
    charger();
    return () => {
      annule = true;
    };
  }, [open]);

  /**
   * Fermer efface la selection.
   *
   * Une quantite oubliee d'une ouverture precedente partirait a la fonte a la
   * suivante sans que personne ne la revoie. Le nettoyage se fait ici plutot
   * que dans un effet : il repond a un geste, pas a un changement d'etat.
   */
  function changerOuverture(ouvert: boolean) {
    if (!ouvert) {
      setQuantites({});
      setFonderieId("");
      setErreur("");
      setRecherche("");
    }
    onOpenChange(ouvert);
  }

  const filtre = useMemo(() => {
    if (!recherche) return catalogue;
    const q = recherche.toLowerCase();
    return catalogue.filter(
      (p) =>
        p.designation.toLowerCase().includes(q) ||
        (p.metal ?? "").toLowerCase().includes(q)
    );
  }, [catalogue, recherche]);

  /** Valeur du metal contenu dans un exemplaire, sans prime ni coefficient. */
  function valeurMetal(p: OrInvestissement): number {
    const coursMetal = cours[p.metal ?? ""] ?? 0;
    const titre = p.titre ? parseFloat(p.titre) : 0;
    return calculerPrixRachatOrInvest(coursMetal, titre, p.poids ?? 0, 1);
  }

  const selection = useMemo(
    () =>
      catalogue
        .map((p) => ({ produit: p, quantite: parseInt(quantites[p.id] ?? "") || 0 }))
        .filter((s) => s.quantite > 0),
    [catalogue, quantites]
  );

  const valeurTotale = selection.reduce(
    (somme, s) => somme + valeurMetal(s.produit) * s.quantite,
    0
  );

  const enExces = selection.filter((s) => s.quantite > s.produit.quantite);

  async function envoyer() {
    if (!fonderieId || selection.length === 0 || enExces.length > 0) return;
    setErreur("");
    setEnvoi(true);

    const fonderie = fonderies.find((f) => f.id === fonderieId)!;
    const resultat = await createBonLivraison({
      fonderieId,
      fonderie,
      items: selection.map((s) =>
        articleDepuisCatalogue(
          {
            id: s.produit.id,
            designation: s.produit.designation,
            metal: s.produit.metal,
            titre: s.produit.titre,
            poids: s.produit.poids,
          },
          s.quantite
        )
      ),
    });

    setEnvoi(false);
    if ("error" in resultat) {
      setErreur(resultat.error);
      return;
    }
    changerOuverture(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changerOuverture}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins size={20} weight="duotone" />
            Envoyer des lingots ou des pièces à la fonte
          </DialogTitle>
          <DialogDescription>
            La prime disparaît à la fonte : ces produits ne valent plus que leur
            métal, au cours du jour.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Rechercher un produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">En stock</TableHead>
                <TableHead className="text-right">Valeur métal</TableHead>
                <TableHead className="w-32 text-right">À fondre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chargement ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtre.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    <Coins size={32} weight="duotone" className="mx-auto mb-2 opacity-40" />
                    Aucun produit en stock.
                  </TableCell>
                </TableRow>
              ) : (
                filtre.map((p) => {
                  const saisie = parseInt(quantites[p.id] ?? "") || 0;
                  const trop = saisie > p.quantite;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-medium">{p.designation}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {p.metal ?? "?"} · {p.titre ?? "?"}‰ · {p.poids ?? 0} g
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.quantite}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(valeurMetal(p))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={p.quantite}
                          step="1"
                          value={quantites[p.id] ?? ""}
                          placeholder="0"
                          aria-label={`Quantité à fondre pour ${p.designation}`}
                          aria-invalid={trop}
                          onChange={(e) =>
                            setQuantites((q) => ({ ...q, [p.id]: e.target.value }))
                          }
                          className={`h-8 w-24 text-right ${trop ? "border-destructive" : ""}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {enExces.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <WarningCircle size={14} weight="duotone" />
            Quantité supérieure au stock pour {enExces[0].produit.designation}.
          </p>
        )}
        {erreur && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <WarningCircle size={14} weight="duotone" />
            {erreur}
          </p>
        )}

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="fonderie_catalogue">Fonderie</Label>
            <Select value={fonderieId} onValueChange={(v) => setFonderieId(v ?? "")}>
              <SelectTrigger id="fonderie_catalogue" className="w-64">
                {fonderies.find((f) => f.id === fonderieId)?.nom ?? (
                  <span className="text-muted-foreground">Choisir une fonderie</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {fonderies.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            {selection.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selection.reduce((n, s) => n + s.quantite, 0)} pièce(s) ·{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(valeurTotale)}
                </span>
              </span>
            )}
            <Button
              onClick={envoyer}
              disabled={envoi || !fonderieId || selection.length === 0 || enExces.length > 0}
            >
              <Factory size={16} weight="duotone" />
              {envoi ? "Envoi..." : "Générer le bon de livraison"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
