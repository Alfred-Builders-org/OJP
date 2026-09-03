import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ReparationsTable } from "@/components/reparations/reparations-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { ReparationRow } from "@/types/reparation";

export const dynamic = "force-dynamic";

/**
 * L'atelier.
 *
 * Les reparations n'avaient pas d'ecran a elles : elles se voyaient depuis la
 * fiche du bijou concerne, ce qui suffisait tant qu'elles portaient toutes sur
 * l'inventaire. Depuis qu'un client peut deposer sa propre chaine, il faut un
 * endroit ou les voir toutes — et ou encaisser ce qu'il doit.
 */
const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["designation", "description", "notes"],
  colonnesFiltres: { statut: "statut" },
  colonnesTri: {
    date_envoi: "date_envoi",
    statut: "statut",
    prix: "prix_facture",
  },
  triParDefaut: { colonne: "date_envoi", ascendant: false },
};

const SELECTION = `
  *,
  bijou:bijoux_stock(id, nom),
  client:clients(id, first_name, last_name)
`;

export default async function ReparationsPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);
  const supabase = await createClient();

  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("reparations").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(
      supabase.from("reparations").select(SELECTION),
      etat,
      OPTIONS
    ).range(etat.from, etat.to),
  ]);

  const reparations = (data ?? []) as unknown as Omit<ReparationRow, "encaisse">[];

  // Ce qui a deja ete encaisse, en une requete pour toute la page : la colonne
  // « reste du » ne vaut rien si elle ignore les acomptes.
  const ids = reparations.map((r) => r.id);
  const encaisseParReparation = new Map<string, number>();
  if (ids.length > 0) {
    const { data: reglements } = await supabase
      .from("reglements")
      .select("reparation_id, montant")
      .in("reparation_id", ids);
    for (const r of reglements ?? []) {
      const cle = r.reparation_id as string;
      encaisseParReparation.set(cle, (encaisseParReparation.get(cle) ?? 0) + Number(r.montant));
    }
  }

  const lignes: ReparationRow[] = reparations.map((r) => ({
    ...r,
    encaisse: encaisseParReparation.get(r.id) ?? 0,
  }));

  return (
    <PageWrapper title="Réparations">
      <ReparationsTable reparations={lignes} total={count ?? 0} />
    </PageWrapper>
  );
}
