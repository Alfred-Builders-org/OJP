import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReparationDetailPage } from "@/components/reparations/reparation-detail-page";
import type { ReparationRow } from "@/types/reparation";
import type { DocumentRecord } from "@/types/document";
import type { Reglement } from "@/types/reglement";

export const dynamic = "force-dynamic";

/**
 * Fiche d'une réparation, sur le modèle d'un lot : l'objet et son propriétaire,
 * la facture émise, et les encaissements. Tout se met à jour depuis ici.
 */
export default async function ReparationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rep } = await supabase
    .from("reparations")
    .select(
      "*, bijou:bijoux_stock(id, nom), client:clients(id, first_name, last_name)",
    )
    .eq("id", id)
    .single();

  if (!rep) notFound();

  const [{ data: documents }, { data: reglements }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("reparation_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reglements")
      .select("*")
      .eq("reparation_id", id)
      .order("date_reglement", { ascending: true }),
  ]);

  const encaisse = (reglements ?? []).reduce((s, r) => s + Number(r.montant), 0);

  return (
    <ReparationDetailPage
      reparation={{ ...(rep as Omit<ReparationRow, "encaisse">), encaisse }}
      documents={(documents ?? []) as DocumentRecord[]}
      reglements={(reglements ?? []) as Reglement[]}
    />
  );
}
