import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { GrossistesTable } from "@/components/grossistes/grossistes-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { Grossiste } from "@/types/grossiste";

const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["nom", "raison_sociale", "ville", "telephone", "email"],
  colonnesTri: { nom: "nom", ville: "ville", telephone: "telephone" },
  triParDefaut: { colonne: "nom", ascendant: true },
};

export default async function GrossistesPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("grossistes").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(supabase.from("grossistes").select("*"), etat, OPTIONS).range(
      etat.from,
      etat.to
    ),
  ]);

  return (
    <PageWrapper title="Grossistes" fullHeight>
      <GrossistesTable
        grossistes={(data ?? []) as Grossiste[]}
        totalItems={count ?? 0}
      />
    </PageWrapper>
  );
}
