"use server";

import { createClient } from "@/lib/supabase/server";
import { createBijouxStockEntry, incrementOrInvestStock } from "@/lib/actions/stock-operations";
import type { LotReference } from "@/types/lot";

type TiersFournisseur = "grossiste" | "fonderie";

/**
 * Ouvre un rachat à un fournisseur (grossiste ou fonderie).
 *
 * Chaque fournisseur a un dossier permanent : on le réutilise s'il existe, on le
 * crée sinon. Le rachat lui-même est un lot de type `rachat`, exactement comme
 * un rachat à un particulier — mais sans pièce d'identité ni délai de
 * rétractation, un fournisseur n'étant pas un consommateur.
 */
export async function ouvrirRachatFournisseur(
  tiersType: TiersFournisseur,
  tiersId: string,
): Promise<{ lotId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const colonneTiers = tiersType === "grossiste" ? "grossiste_id" : "fonderie_id";

  // Dossier permanent du fournisseur : réutilisé s'il existe.
  const { data: existant } = await supabase
    .from("dossiers")
    .select("id")
    .eq(colonneTiers, tiersId)
    .limit(1)
    .maybeSingle();

  let dossierId = existant?.id;
  if (!dossierId) {
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .insert({
        numero: "",
        tiers_type: tiersType,
        [colonneTiers]: tiersId,
        status: "brouillon",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (dossierError || !dossier) {
      return { error: dossierError?.message ?? "Création du dossier impossible." };
    }
    dossierId = dossier.id;
  }

  const { data: parametres } = await supabase
    .from("parametres")
    .select("prix_or, prix_argent, prix_platine, coefficient_rachat, coefficient_vente")
    .eq("id", 1)
    .single();

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .insert({
      numero: "",
      dossier_id: dossierId,
      type: "rachat",
      status: "brouillon",
      cours_or_snapshot: parametres?.prix_or,
      cours_argent_snapshot: parametres?.prix_argent,
      cours_platine_snapshot: parametres?.prix_platine,
      coefficient_rachat_snapshot: parametres?.coefficient_rachat,
      coefficient_vente_snapshot: parametres?.coefficient_vente,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (lotError || !lot) return { error: lotError?.message ?? "Création du lot impossible." };
  return { lotId: lot.id };
}

/**
 * Finalise un rachat fournisseur : les articles entrent en stock, le lot est
 * clos.
 *
 * Chemin volontairement plus court que le rachat client — pas de devis, pas de
 * quittance, pas de délai. L'inscription au livre de police se fait, elle, à
 * l'ajout de chaque référence (déclencheur `inscrire_au_registre`, qui sait
 * traiter le tiers professionnel).
 */
export async function finaliserRachatFournisseur(
  lotId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: refs } = await supabase
    .from("lot_references")
    .select("*")
    .eq("lot_id", lotId);

  if (!refs || refs.length === 0) {
    return { error: "Ajoutez au moins une référence avant de finaliser." };
  }

  for (const ref of refs as LotReference[]) {
    if (ref.or_investissement_id) {
      const { error } = await incrementOrInvestStock({ supabase, ref });
      if (error) return { error: "Erreur lors de l'entrée en stock d'un produit d'investissement." };
    } else {
      const { error } = await createBijouxStockEntry({ supabase, ref, lotId });
      if (error) return { error: "Erreur lors de l'entrée en stock d'un article." };
    }
  }

  const { error: lotError } = await supabase
    .from("lots")
    .update({ status: "finalise", outcome: "complete", date_finalisation: new Date().toISOString() })
    .eq("id", lotId);

  if (lotError) return { error: lotError.message };
  return {};
}
