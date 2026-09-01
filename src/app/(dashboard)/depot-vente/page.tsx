import { createClient } from "@/lib/supabase/server";
import { ALL_WITH_DOSSIER_CLIENT } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { LotTable } from "@/components/lots/lot-table";
import { chargerLots } from "@/lib/data-grid/lots";
import type { ParamsTableau } from "@/lib/data-grid/query";

export default async function DepotVentePage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { lots, count } = await chargerLots(
    supabase,
    params,
    "depot_vente",
    ALL_WITH_DOSSIER_CLIENT
  );

  return (
    <PageWrapper title="Dépôt-vente" fullHeight>
      <LotTable
        data={lots}
        basePath="/depot-vente"
        lotType="depot_vente"
        totalItems={count}
      />
    </PageWrapper>
  );
}
