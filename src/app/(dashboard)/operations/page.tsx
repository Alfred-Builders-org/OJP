import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { OperationsTable } from "@/components/operations/operations-table";
import {
  lireParams,
  appliquerFiltres,
  clauseAvecClient,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { OperationRow } from "@/types/operation";

export const dynamic = "force-dynamic";

/**
 * Toutes les operations, d'ou qu'elles viennent.
 *
 * Les rachats, ventes et depots-vente ne se consultaient que depuis leur
 * dossier : il fallait savoir a quel client s'adresser avant de pouvoir
 * retrouver une affaire. Impossible, donc, de balayer « les rachats factures de
 * mars », ce que la comptabilite demande tous les trimestres.
 *
 * Cette page ne remplace pas le dossier — elle donne l'entree par l'operation
 * plutot que par la personne.
 */
const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["numero"],
  colonnesFiltres: { type: "type", statut: "status", issue: "outcome" },
  colonnesTri: {
    numero: "numero",
    date: "created_at",
    montant: "total_prix_achat",
    statut: "status",
  },
  triParDefaut: { colonne: "created_at", ascendant: false },
};

const SELECTION = `
  id, numero, type, status, outcome, created_at, date_finalisation,
  total_prix_achat, total_prix_revente,
  dossier:dossiers(id, numero, client:clients(id, first_name, last_name)),
  factures(id, numero, montant_ttc)
`;

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  const supabase = await createClient();

  // La presence d'une facture n'est pas une colonne : elle se lit dans une table
  // liee. Le filtre est donc applique a la main, hors du helper generique —
  // comme la provenance sur la page Stock.
  const facturation = etat.filtres.facture ?? [];
  const idsFactures =
    facturation.length === 1
      ? ((await supabase.from("factures").select("lot_id")).data ?? [])
          .map((f) => f.lot_id as string)
          .filter(Boolean)
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtrerFacture = <T extends { in: any; not: any }>(q: T): T => {
    if (facturation.length !== 1) return q;
    if (idsFactures.length === 0) {
      // Aucune facture : « avec » ne rend rien, « sans » rend tout.
      return facturation[0] === "avec"
        ? q.in("id", ["00000000-0000-0000-0000-000000000000"])
        : q;
    }
    return facturation[0] === "avec"
      ? q.in("id", idsFactures)
      : q.not("id", "in", `(${idsFactures.join(",")})`);
  };

  // La recherche porte sur le numero de l'operation ET sur le nom du client :
  // c'est souvent le seul des deux dont on dispose.
  let idsDossiers: string[] = [];
  if (etat.search) {
    const terme = etat.search.replace(/[(),]/g, " ").trim();
    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .or(`first_name.ilike.%${terme}%,last_name.ilike.%${terme}%`);
    const idsClients = (clients ?? []).map((c) => c.id as string);
    if (idsClients.length > 0) {
      const { data: dossiers } = await supabase
        .from("dossiers")
        .select("id")
        .in("client_id", idsClients);
      idsDossiers = (dossiers ?? []).map((d) => d.id as string);
    }
  }

  // Recherche appliquee a la main : le helper generique ne sait pas joindre le
  // client, et `clauseAvecClient` construit exactement cette clause elargie.
  const etatSansRecherche = { ...etat, search: "", filtres: Object.fromEntries(
    Object.entries(etat.filtres).filter(([cle]) => cle !== "facture")
  ) };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rechercher = <T extends { or: any }>(q: T): T =>
    etat.search
      ? q.or(clauseAvecClient(etat.search, "numero", "dossier_id", idsDossiers))
      : q;

  const [{ count }, { data }] = await Promise.all([
    filtrerFacture(
      rechercher(
        appliquerFiltres(
          supabase.from("lots").select("*", { count: "exact", head: true }),
          etatSansRecherche,
          { ...OPTIONS, triParDefaut: undefined }
        )
      )
    ),
    filtrerFacture(
      rechercher(
        appliquerFiltres(
          supabase.from("lots").select(SELECTION),
          etatSansRecherche,
          OPTIONS
        )
      )
    ).range(etat.from, etat.to),
  ]);

  return (
    <PageWrapper title="Opérations">
      <OperationsTable
        operations={(data ?? []) as unknown as OperationRow[]}
        total={count ?? 0}
      />
    </PageWrapper>
  );
}
