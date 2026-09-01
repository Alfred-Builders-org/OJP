import { createClient } from "@/lib/supabase/server";
import { ALL_WITH_DOSSIER_CLIENT } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { LotTable } from "@/components/lots/lot-table";
import { chargerLots } from "@/lib/data-grid/lots";
import type { ParamsTableau } from "@/lib/data-grid/query";

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { lots, count } = await chargerLots(
    supabase,
    params,
    "rachat",
    ALL_WITH_DOSSIER_CLIENT
  );

  return (
    <PageWrapper title="Rachat" fullHeight>
      <LotTable data={lots} totalItems={count} />
    </PageWrapper>
  );
}
