"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ouvrirRachatFournisseur } from "@/lib/actions/fournisseur-actions";

/**
 * Ouvre un rachat à un fournisseur et mène à sa fiche.
 *
 * Un rachat à un grossiste ou à une fonderie emprunte le même chemin qu'un
 * rachat à un particulier — dossier, lot, références — mais s'ouvre depuis la
 * fiche du fournisseur plutôt que depuis un dossier client.
 */
export function NouveauRachatBouton({
  tiersType,
  tiersId,
  libelle = "Nouveau rachat",
}: {
  tiersType: "grossiste" | "fonderie";
  tiersId: string;
  libelle?: string;
}) {
  const router = useRouter();
  const [ouverture, setOuverture] = useState(false);

  async function ouvrir() {
    setOuverture(true);
    const resultat = await ouvrirRachatFournisseur(tiersType, tiersId);
    setOuverture(false);
    if ("error" in resultat) {
      toast.error(resultat.error);
      return;
    }
    router.push(`/lots/${resultat.lotId}`);
  }

  return (
    <Button size="sm" onClick={ouvrir} disabled={ouverture}>
      <Plus size={16} weight="bold" />
      {ouverture ? "Ouverture..." : libelle}
    </Button>
  );
}
