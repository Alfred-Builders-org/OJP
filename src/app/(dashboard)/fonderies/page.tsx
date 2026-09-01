import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { FonderiesTable } from "@/components/fonderies/fonderies-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { Fonderie } from "@/types/fonderie";

const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["nom", "ville", "telephone", "email"],
  colonnesTri: { nom: "nom", ville: "ville", telephone: "telephone" },
  triParDefaut: { colonne: "nom", ascendant: true },
};

export default async function FonderiesPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("fonderies").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(supabase.from("fonderies").select("*"), etat, OPTIONS).range(
      etat.from,
      etat.to
    ),
  ]);

  return (
    <PageWrapper title="Fonderies" fullHeight>
      <FonderiesTable
        fonderies={(data ?? []) as Fonderie[]}
        totalItems={count ?? 0}
      />
    </PageWrapper>
  );
}
