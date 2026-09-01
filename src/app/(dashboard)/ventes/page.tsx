import { createClient } from "@/lib/supabase/server";
import { ALL_WITH_DOSSIER_CLIENT } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { VenteTable } from "@/components/ventes/vente-table";
import { chargerLots } from "@/lib/data-grid/lots";
import type { ParamsTableau } from "@/lib/data-grid/query";

export default async function VentesPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { lots, count } = await chargerLots(
    supabase,
    params,
    "vente",
    ALL_WITH_DOSSIER_CLIENT
  );

  return (
    <PageWrapper title="Ventes" fullHeight>
      <VenteTable data={lots} totalItems={count} />
    </PageWrapper>
  );
}
