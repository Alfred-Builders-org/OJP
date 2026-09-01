import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { OrInvestissementTable } from "@/components/or-investissement/or-investissement-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { OrInvestissement } from "@/types/or-investissement";
import type { UserRole } from "@/types/auth";

const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["designation", "pays", "metal", "titre"],
  colonnesFiltres: { metal: "metal" },
  colonnesTri: {
    designation: "designation",
    pays: "pays",
    annees: "annees",
    metal: "metal",
    titre: "titre",
    poids: "poids",
    quantite: "quantite",
  },
  triParDefaut: { colonne: "designation", ascendant: true },
};

export default async function OrInvestissementPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = (profile?.role ?? "vendeur") as UserRole;

  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("or_investissement").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(
      supabase.from("or_investissement").select("*"),
      etat,
      OPTIONS
    ).range(etat.from, etat.to),
  ]);

  const items = (data ?? []) as OrInvestissement[];

  return (
    <PageWrapper title="Or Investissement" fullHeight>
      <OrInvestissementTable data={items} canEdit={role === "proprietaire" || role === "super_admin"} totalItems={count ?? 0} />
    </PageWrapper>
  );
}
