"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coins, Package, CheckCircle, Handshake } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";

interface LigneRow {
  id: string;
  designation: string;
  metal: string | null;
  quantite: number;
  prix_total: number;
  fulfillment: string;
  is_livre: boolean;
  date_reception: string | null;
  bon_commande_id: string | null;
}

interface LivraisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId: string;
}

export function LivraisonDialog({ open, onOpenChange, lotId }: LivraisonDialogProps) {
  const router = useRouter();
  const [lignes, setLignes] = useState<LigneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    async function fetch() {
      setLoading(true);
      const supabase = createClient();
      // Only show lines that are fulfilled (servi_stock or recu) — ready to hand to client
      // Les lignes encore en commande entrent aussi dans la liste : c'est ici
      // qu'on les receptionne. Elles en etaient exclues, donc invisibles tant
      // que le bon de commande n'avait pas ete traite de son cote.
      const { data } = await supabase
        .from("vente_lignes")
        .select("id, designation, metal, quantite, prix_total, fulfillment, is_livre, date_reception, bon_commande_id")
        .eq("lot_id", lotId)
        .in("fulfillment", ["servi_stock", "commande", "recu"])
        .order("created_at", { ascending: true });
      setLignes((data ?? []) as LigneRow[]);
      setLoading(false);
    }
    fetch();
  }, [open, lotId]);

  /**
   * Reception en boutique.
   *
   * Etape intermediaire entre « servi » ou « commande » et « remis au client » :
   * la marchandise est arrivee, on la met de cote, et le client vient la
   * chercher plus tard. Entre les deux, c'est la boutique qui detient le bien.
   */
  async function receptionner(ligne: LigneRow) {
    setToggling(ligne.id);
    const supabase = createClient();
    const maintenant = new Date().toISOString();

    const { error } = await mutate(
      supabase
        .from("vente_lignes")
        .update({ fulfillment: "recu", date_reception: maintenant })
        .eq("id", ligne.id),
      "La réception n'a pas pu être enregistrée",
      "Article reçu en boutique"
    );
    if (error) {
      setToggling(null);
      return;
    }

    setLignes((prev) =>
      prev.map((l) =>
        l.id === ligne.id ? { ...l, fulfillment: "recu", date_reception: maintenant } : l
      )
    );

    // Une ligne rattachee a un bon de commande fait avancer ce bon des que
    // toutes ses lignes sont arrivees — sans quoi le bon annoncerait encore
    // « en attente de reception » alors que tout est la.
    if (ligne.bon_commande_id) {
      const { data: soeurs } = await supabase
        .from("vente_lignes")
        .select("id, fulfillment")
        .eq("bon_commande_id", ligne.bon_commande_id);

      const toutesRecues = (soeurs ?? []).every(
        (l) => l.id === ligne.id || l.fulfillment === "recu"
      );
      if (toutesRecues) {
        // On n'ecrase pas un bon deja paye : « paye » vaut plus que « recu ».
        await supabase
          .from("bons_commande")
          .update({ statut: "recu" })
          .eq("id", ligne.bon_commande_id)
          .eq("statut", "envoye");
      }
    }

    setToggling(null);
    router.refresh();
  }

  async function toggleLivre(ligne: LigneRow) {
    setToggling(ligne.id);
    const supabase = createClient();
    const newValue = !ligne.is_livre;
    const { error } = await mutate(
      supabase.from("vente_lignes").update({ is_livre: newValue }).eq("id", ligne.id),
      "Erreur lors de la mise à jour",
      newValue ? "Article livré au client" : "Livraison annulée"
    );
    if (error) { setToggling(null); return; }

    // Update local state
    setLignes((prev) => prev.map((l) => l.id === ligne.id ? { ...l, is_livre: newValue } : l));

    // Check auto-finalization
    if (newValue) {
      const { data: allLignes } = await supabase
        .from("vente_lignes")
        .select("fulfillment, is_livre")
        .eq("lot_id", lotId);

      const allLivre = (allLignes ?? []).every((l) => l.is_livre);
      const allFulfilled = (allLignes ?? []).every(
        (l) => l.fulfillment === "servi_stock" || l.fulfillment === "recu"
      );

      if (allLivre && allFulfilled) {
        const { data: lotDocs } = await supabase
          .from("documents")
          .select("status, type")
          .eq("lot_id", lotId)
          .in("type", ["facture_vente", "facture_acompte", "facture_solde"]);
        const allPaid = (lotDocs ?? []).every((d) => d.status === "regle");

        if (allPaid) {
          const { data: lot } = await supabase
            .from("lots")
            .select("id, status, dossier_id")
            .eq("id", lotId)
            .single();

          if (lot && lot.status === "en_cours") {
            await supabase.from("lots").update({
              status: "finalise",
              outcome: "complete",
              date_finalisation: new Date().toISOString(),
            }).eq("id", lot.id);

            const { data: allLots } = await supabase
              .from("lots")
              .select("status")
              .eq("dossier_id", lot.dossier_id);
            if ((allLots ?? []).every((l) => l.status === "finalise")) {
              await supabase.from("dossiers").update({ status: "finalise" }).eq("id", lot.dossier_id);
            }

            toast.success("Vente finalisée automatiquement");
          }
        }
      }
    }

    setToggling(null);
    router.refresh();
  }

  const aRecevoir = lignes.filter((l) => l.fulfillment !== "recu" && !l.is_livre);
  const aLivrer = lignes.filter((l) => l.fulfillment === "recu" && !l.is_livre);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={20} weight="duotone" />
            Livraison au client
          </DialogTitle>
          <DialogDescription>
            {aRecevoir.length === 0 && aLivrer.length === 0
              ? "Tous les articles ont été remis au client."
              : [
                  aRecevoir.length > 0
                    ? `${aRecevoir.length} article${aRecevoir.length > 1 ? "s" : ""} à réceptionner`
                    : null,
                  aLivrer.length > 0
                    ? `${aLivrer.length} prêt${aLivrer.length > 1 ? "s" : ""} à remettre au client`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
          ) : lignes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun article à traiter.</p>
          ) : (
            lignes.map((ligne) => (
              <div
                key={ligne.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${ligne.is_livre ? "bg-muted/30" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Coins size={16} weight="duotone" className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">{ligne.designation}</span>
                    <span className="text-xs text-muted-foreground block">
                      {ligne.metal ?? ""} · x{ligne.quantite} · {formatCurrency(ligne.prix_total)}
                    </span>
                    {/* Ou en est l'article : c'est ce qui explique le bouton
                        propose en face. */}
                    <span className="text-xs text-muted-foreground">
                      {ligne.fulfillment === "recu"
                        ? `Reçu${ligne.date_reception ? ` le ${formatDate(ligne.date_reception)}` : ""}`
                        : ligne.fulfillment === "commande"
                          ? "Commandé à la fonderie"
                          : "Servi du stock"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {ligne.is_livre ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle size={10} weight="duotone" className="mr-0.5" />
                        Livré
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive"
                        disabled={toggling === ligne.id}
                        onClick={() => toggleLivre(ligne)}
                      >
                        {toggling === ligne.id ? "..." : "Annuler"}
                      </Button>
                    </div>
                  ) : ligne.fulfillment === "recu" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggling === ligne.id}
                      onClick={() => toggleLivre(ligne)}
                    >
                      <Handshake size={14} weight="duotone" />
                      {toggling === ligne.id ? "..." : "Livrer au client"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggling === ligne.id}
                      onClick={() => receptionner(ligne)}
                    >
                      <Package size={14} weight="duotone" />
                      {toggling === ligne.id ? "..." : "Marquer reçu"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
