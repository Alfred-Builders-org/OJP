import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { RegistreTable } from "@/components/registre/registre-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { RegistreObjet } from "@/types/registre";

/**
 * Registre des objets mobiliers — le « livre de police » de l'article 321-7 du
 * code pénal.
 *
 * Il s'ordonne par numéro d'ordre croissant, comme un registre papier : c'est la
 * continuité de la séquence qui fait sa valeur, et une lecture antichronologique
 * la rendrait illisible à un contrôle.
 */
const OPTIONS: OptionsRequete = {
  colonnesRecherche: [
    "cedant_nom",
    "cedant_prenoms",
    "objet_nature",
    "objet_description",
    "piece_numero",
    "reference",
  ],
  colonnesTri: {
    numero_ordre: "numero_ordre",
    date_entree: "date_entree",
    cedant: "cedant_nom",
    prix: "prix",
  },
  triParDefaut: { colonne: "numero_ordre", ascendant: true },
};

export default async function RegistrePage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  const [{ count }, { data }] = await Promise.all([
    appliquerFiltres(
      supabase.from("registre_objets").select("*", { count: "exact", head: true }),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(
      supabase.from("registre_objets").select("*"),
      etat,
      OPTIONS
    ).range(etat.from, etat.to),
  ]);

  return (
    <PageWrapper title="Registre des objets mobiliers" fullHeight>
      <RegistreTable
        data={(data ?? []) as RegistreObjet[]}
        totalItems={count ?? 0}
      />
    </PageWrapper>
  );
}
