import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { SuiviPageClient } from "@/components/fonderie/suivi-page-client";
import type { BonCommande } from "@/types/bon-commande";
import type { BonLivraison } from "@/types/bon-livraison";
import type { FonderieLotRow, EcartRow } from "@/types/fonderie-lot";

export default async function SuiviPage() {
  const supabase = await createClient();

  const [{ data: bdcData }, { data: bdlData }] = await Promise.all([
    supabase
      .from("bons_commande")
      .select("*, fonderie:fonderies(*), lignes:vente_lignes(id)")
      .order("created_at", { ascending: false }),
    supabase
      .from("bons_livraison")
      .select("*, fonderie:fonderies(*), lignes:bon_livraison_lignes(id)")
      .order("created_at", { ascending: false }),
  ]);

  const bdcList = (bdcData ?? []) as (BonCommande & { lignes: { id: string }[] })[];
  const bdlList = (bdlData ?? []) as (BonLivraison & { lignes: { id: string }[] })[];

  // Normalize to unified rows
  const rows: FonderieLotRow[] = [
    ...bdcList.map((bdc) => ({
      id: bdc.id,
      numero: bdc.numero,
      type: "commande" as const,
      fonderie_id: bdc.fonderie_id,
      fonderie_nom: bdc.fonderie?.nom ?? "Fonderie",
      statut: bdc.statut,
      montant: bdc.montant_fonderie,
      nb_lignes: bdc.lignes?.length ?? 0,
      date_creation: bdc.created_at,
      date_envoi: bdc.date_envoi,
      date_reception: bdc.date_reception,
    })),
    ...bdlList.map((bdl) => ({
      id: bdl.id,
      numero: bdl.numero,
      type: "fonte" as const,
      fonderie_id: bdl.fonderie_id,
      fonderie_nom: bdl.fonderie?.nom ?? "Fonderie",
      statut: bdl.statut,
      montant: bdl.valeur_estimee,
      nb_lignes: bdl.lignes?.length ?? 0,
      date_creation: bdl.created_at,
      date_envoi: bdl.date_envoi,
      date_reception: bdl.date_reception,
    })),
  ];

  // Sort by date desc
  rows.sort(
    (a, b) =>
      new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime(),
  );

  // Unique fonderie names for filter
  const fonderies = [...new Set(rows.map((r) => r.fonderie_nom))].sort();

  // Les ecarts : ce que la fonderie a constate et qui ne correspond pas a ce
  // qu'on lui avait annonce. Une ligne compte des qu'un titrage, un poids ou un
  // montant a bouge — le reste est conforme et n'a rien a faire ici.
  const { data: lignesEcart } = await supabase
    .from("bon_livraison_lignes")
    .select("*, bon_livraison:bons_livraison!inner(id, numero, fonderie:fonderies(nom))")
    .or("ecart_titrage.eq.true,ecart_poids.eq.true")
    .order("date_test", { ascending: false });

  const ecarts: EcartRow[] = (lignesEcart ?? []).map((l) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bdl = l.bon_livraison as any;
    return {
      id: l.id,
      bdl_id: bdl?.id ?? "",
      bdl_numero: bdl?.numero ?? "—",
      fonderie_nom: bdl?.fonderie?.nom ?? "Fonderie",
      designation: l.designation,
      metal: l.metal,
      titrage_declare: l.titrage_declare,
      titrage_reel: l.titrage_reel,
      poids_declare: l.poids_declare,
      poids_reel: l.poids_reel,
      valeur_estimee: l.valeur_estimee,
      valeur_reelle: l.valeur_reelle,
      ecart_valeur:
        l.valeur_reelle != null && l.valeur_estimee != null
          ? Math.round((l.valeur_reelle - l.valeur_estimee) * 100) / 100
          : null,
      ecart_titrage: !!l.ecart_titrage,
      ecart_poids: !!l.ecart_poids,
      ecart_notes: l.ecart_notes,
      date_test: l.date_test,
    };
  });

  return (
    <PageWrapper title="Suivi fonderie" fullHeight>
      <SuiviPageClient rows={rows} fonderies={fonderies} ecarts={ecarts} />
    </PageWrapper>
  );
}
