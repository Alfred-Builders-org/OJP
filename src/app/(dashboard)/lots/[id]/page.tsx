import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { autoProcessExpiredRetractation } from "@/lib/actions/finalize-actions";
import { LotDetailPage } from "@/components/lots/lot-detail-page";
import { FournisseurLotDetailPage } from "@/components/lots/fournisseur-lot-detail-page";

const cachedAutoProcess = cache(async (dossierId: string) => {
  await autoProcessExpiredRetractation(dossierId);
});
import type { LotWithReferences, LotReference } from "@/types/lot";
import type { DocumentRecord } from "@/types/document";
import type { Reglement } from "@/types/reglement";

export default async function LotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("lots")
    .select("*, dossier:dossiers(id, numero, tiers_type, client:clients(id, civility, first_name, last_name, email, phone, city, is_valid), grossiste:grossistes(id, nom, raison_sociale), fonderie:fonderies(id, nom))")
    .eq("id", id)
    .single();

  if (!lot) return notFound();

  // Un lot de fonte n'a pas de références : son contenu vit dans le bon de
  // livraison. On mène donc directement à la fiche de l'envoi, qui porte déjà
  // les articles, les écarts et le règlement de la fonderie.
  if (lot.type === "fonte") {
    const { data: bdl } = await supabase
      .from("bons_livraison")
      .select("id")
      .eq("lot_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bdl) redirect(`/fonderie/suivi/bdl/${bdl.id}`);
    return notFound();
  }

  // Un lot de fournisseur (grossiste ou fonderie) n'a ni pièce d'identité, ni
  // devis, ni délai de rétractation : sa fiche est distincte, et la fiche du
  // rachat client reste inchangée.
  if (lot.dossier?.tiers_type && lot.dossier.tiers_type !== "client") {
    const { data: refsFournisseur } = await supabase
      .from("lot_references")
      .select("*")
      .eq("lot_id", id)
      .order("created_at", { ascending: true });
    const { data: catalogueFournisseur } = await supabase
      .from("or_investissement")
      .select("*")
      .order("designation", { ascending: true });
    return (
      <FournisseurLotDetailPage
        lot={{ ...lot, references: (refsFournisseur ?? []) as LotReference[] } as LotWithReferences & { dossier: typeof lot.dossier }}
        orInvestCatalog={catalogueFournisseur ?? []}
      />
    );
  }

  // Auto-process expired retractation before rendering (cached to prevent double-execution)
  await cachedAutoProcess(lot.dossier_id);

  const { data: references } = await supabase
    .from("lot_references")
    .select("*")
    .eq("lot_id", id)
    .order("created_at", { ascending: true });

  // Fetch or_investissement catalog for the form
  const { data: orInvestCatalog } = await supabase
    .from("or_investissement")
    .select("*")
    .order("designation", { ascending: true });

  // Fetch documents for this lot
  const { data: documents } = await supabase
    .from("documents")
    .select("*, document_references(id, document_id, lot_reference_id)")
    .eq("lot_id", id)
    .order("created_at", { ascending: false });

  // Fetch reglements for this lot
  const { data: reglements } = await supabase
    .from("reglements")
    .select("*")
    .eq("lot_id", id)
    .order("date_reglement", { ascending: true });

  const lotWithRefs: LotWithReferences & { dossier: typeof lot.dossier } = {
    ...lot,
    references: (references ?? []) as LotReference[],
  };

  return (
    <LotDetailPage
      lot={lotWithRefs}
      orInvestCatalog={orInvestCatalog ?? []}
      documents={(documents ?? []) as DocumentRecord[]}
      reglements={(reglements ?? []) as Reglement[]}
    />
  );
}
