import Link from "next/link";
import { UserPlus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ClientTable } from "@/components/clients/client-table";
import { Button } from "@/components/ui/button";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { Client } from "@/types/client";

/**
 * Recherche, filtres et tri sont appliqués ici, dans la requête, et non plus en
 * mémoire sur la page affichée : chercher un client absent de la première page
 * ne renvoyait rien, et le compteur de pagination annonçait le total de la base
 * pendant que le tableau montrait un sous-ensemble filtré.
 */
const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["first_name", "last_name", "maiden_name", "email", "phone", "city"],
  colonnesFiltres: { source: "lead_source" },
  colonnesTri: { nom: "last_name", ville: "city", date: "created_at" },
  triParDefaut: { colonne: "created_at", ascendant: false },
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  // Le compteur porte les mêmes filtres que les données : c'est ce qui rend le
  // « 1–20 sur N » honnête.
  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("clients").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(supabase.from("clients").select("*"), etat, OPTIONS).range(
      etat.from,
      etat.to
    ),
  ]);

  const clients = (data ?? []) as Client[];

  return (
    <PageWrapper
      title="Clients"
      fullHeight
      headerActions={
        <Link href="/clients/new">
          <Button size="sm">
            <UserPlus size={16} weight="duotone" />
            Nouveau client
          </Button>
        </Link>
      }
    >
      <ClientTable data={clients} totalItems={count ?? 0} />
    </PageWrapper>
  );
}
