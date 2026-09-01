import { getParametres } from "@/lib/parametres";
import { getAllSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ParametresForm } from "@/components/parametres/parametres-form";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { SettingsMap } from "@/types/settings";
import type { OrInvestissement } from "@/types/or-investissement";
import type { UserRole } from "@/types/auth";

const OPTIONS_OR_INVEST: OptionsRequete = {
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

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;

  const [parametres, settings] = await Promise.all([
    getParametres(),
    getAllSettings() as Promise<SettingsMap>,
  ]);

  // Le catalogue est le seul reglage dont le contenu vit en table plutot qu'en
  // `settings`. On ne le charge que lorsque sa section est ouverte : ouvrir
  // « Societe » n'a aucune raison de compter les pieces.
  let catalogue: {
    items: OrInvestissement[];
    total: number;
    canEdit: boolean;
  } | null = null;

  if (params.section === "or-investissement") {
    const etat = lireParams(params);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();
    const role = (profile?.role ?? "vendeur") as UserRole;

    const [{ count }, { data }] = await Promise.all([
      appliquerFiltres(
        supabase
          .from("or_investissement")
          .select("*", { count: "exact", head: true }),
        etat,
        { ...OPTIONS_OR_INVEST, triParDefaut: undefined }
      ),
      appliquerFiltres(
        supabase.from("or_investissement").select("*"),
        etat,
        OPTIONS_OR_INVEST
      ).range(etat.from, etat.to),
    ]);

    catalogue = {
      items: (data ?? []) as OrInvestissement[],
      total: count ?? 0,
      canEdit: role === "proprietaire" || role === "super_admin",
    };
  }

  return (
    <PageWrapper title="Paramètres" fullHeight noPadding>
      <ParametresForm
        parametres={parametres}
        settings={settings}
        catalogue={catalogue}
      />
    </PageWrapper>
  );
}
