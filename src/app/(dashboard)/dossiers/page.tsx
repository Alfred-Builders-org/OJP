import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { DossierTable } from "@/components/dossiers/dossier-table";
import { DossierCreateButton } from "@/components/dossiers/dossier-create-button";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { DossierWithClient } from "@/types/dossier";
import type { Client } from "@/types/client";

const OPTIONS: OptionsRequete = {
  // La recherche par nom de client est resolue en amont : PostgREST ne sait pas
  // melanger, dans un meme OU, une colonne de la table et une colonne jointe.
  colonnesRecherche: ["numero"],
  colonnesFiltres: { statut: "status" },
  colonnesTri: { numero: "numero", statut: "status", date: "created_at" },
  triParDefaut: { colonne: "created_at", ascendant: false },
};

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  // Un dossier se cherche aussi par le nom de son client : on resout d'abord
  // les clients correspondants, puis on elargit la clause au lot d'identifiants.
  let clauseRecherche: string | null = null;
  if (etat.search) {
    const terme = etat.search.replace(/[(),]/g, " ").trim();
    const { data: clientsTrouves } = await supabase
      .from("clients")
      .select("id")
      .or(`first_name.ilike.%${terme}%,last_name.ilike.%${terme}%`)
      .limit(200);

    const ids = (clientsTrouves ?? []).map((c) => c.id);
    clauseRecherche = ids.length
      ? `numero.ilike.%${terme}%,client_id.in.(${ids.join(",")})`
      : `numero.ilike.%${terme}%`;
  }

  const etatSansRecherche = { ...etat, search: "" };
  const appliquerRecherche = <T extends { or: (c: string) => T }>(q: T): T =>
    clauseRecherche ? q.or(clauseRecherche) : q;

  const [{ count }, { data }, { data: clientsData }] = await Promise.all([
    appliquerRecherche(
      appliquerFiltres(
        supabase.from("dossiers").select("*", { count: "exact", head: true }),
        etatSansRecherche,
        { ...OPTIONS, triParDefaut: undefined }
      )
    ),
    appliquerRecherche(
      appliquerFiltres(
        supabase
          .from("dossiers")
          .select("*, client:clients(id, civility, first_name, last_name, is_valid)"),
        etatSansRecherche,
        OPTIONS
      )
    ).range(etat.from, etat.to),
    supabase
      .from("clients")
      .select("*")
      .eq("is_valid", true)
      .order("last_name", { ascending: true }),
  ]);

  const dossiers = (data ?? []) as DossierWithClient[];
  const validClients = (clientsData ?? []) as Client[];

  // Count pending actions per dossier
  const dossierIds = dossiers.map((d) => d.id);
  const actionCounts: Record<string, number> = {};

  if (dossierIds.length > 0) {
    // Fetch lots for these dossiers
    const { data: lotsData } = await supabase
      .from("lots")
      .select("id, dossier_id, status, type")
      .in("dossier_id", dossierIds);

    const lots = lotsData ?? [];
    const lotIds = lots.map((l) => l.id);

    if (lotIds.length > 0) {
      // Refs needing attention: en_retractation, devis_envoye, en_attente_paiement
      const { data: pendingRefs } = await supabase
        .from("lot_references")
        .select("lot_id, status")
        .in("lot_id", lotIds)
        .in("status", ["en_retractation", "devis_envoye", "en_attente_paiement"]);

      // Documents needing attention: en_attente (to sign)
      const { data: pendingDocs } = await supabase
        .from("documents")
        .select("lot_id, status, type")
        .in("lot_id", lotIds)
        .eq("status", "en_attente");

      // Vente lignes pending dispatch
      const { data: pendingLignes } = await supabase
        .from("vente_lignes")
        .select("lot_id, fulfillment")
        .in("lot_id", lotIds)
        .in("fulfillment", ["pending", "a_commander"]);

      // Build lot → dossier map
      const lotToDossier = Object.fromEntries(lots.map((l) => [l.id, l.dossier_id]));

      for (const ref of pendingRefs ?? []) {
        const dosId = lotToDossier[ref.lot_id];
        if (dosId) actionCounts[dosId] = (actionCounts[dosId] ?? 0) + 1;
      }
      for (const doc of pendingDocs ?? []) {
        if (!doc.lot_id) continue;
        const dosId = lotToDossier[doc.lot_id];
        if (dosId) actionCounts[dosId] = (actionCounts[dosId] ?? 0) + 1;
      }
      for (const ligne of pendingLignes ?? []) {
        const dosId = lotToDossier[ligne.lot_id];
        if (dosId) actionCounts[dosId] = (actionCounts[dosId] ?? 0) + 1;
      }
    }
  }

  return (
    <PageWrapper
      title="Dossiers"
      fullHeight
      headerActions={<DossierCreateButton validClients={validClients} />}
    >
      <DossierTable data={dossiers} totalItems={count ?? 0} actionCounts={actionCounts} />
    </PageWrapper>
  );
}
