import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { StockTable } from "@/components/stock/stock-table";
import {
  lireParams,
  appliquerFiltres,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { BijouxStock, BijouxStockWithOrigin } from "@/types/bijoux";
import type { UserRole } from "@/types/auth";

const OPTIONS: OptionsRequete = {
  colonnesRecherche: ["nom", "description", "metaux", "qualite"],
  colonnesFiltres: { statut: "statut", metal: "metaux" },
  colonnesTri: {
    nom: "nom",
    statut: "statut",
    metal: "metaux",
    qualite: "qualite",
    poids: "poids",
    prix_achat: "prix_achat",
    prix_revente: "prix_revente",
  },
  triParDefaut: { colonne: "date_creation", ascendant: false },
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<ParamsTableau>;
}) {
  const params = await searchParams;
  const etat = lireParams(params);

  // Le Stock bijoux montre tout ce qui est physiquement en boutique : articles
  // en stock, en depot-vente, en reparation, et ceux qui attendent un envoi en
  // fonderie. Seul « fondu » est exclu — cette marchandise n'existe plus.
  //
  // Les deux filtres precedents (`depot_vente_lot_id IS NULL` et l'exclusion de
  // « a_fondre ») rendaient invisibles les articles justement crees par un
  // rachat ou un depot-vente : deux filtres de la barre d'outils ne pouvaient
  // structurellement rien renvoyer.
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { count }, { data }, { data: originRefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single(),
    appliquerFiltres(
      supabase
        .from("bijoux_stock")
        .select("*", { count: "exact", head: true })
        .neq("statut", "fondu"),
      etat,
      { ...OPTIONS, triParDefaut: undefined }
    ),
    appliquerFiltres(
      supabase.from("bijoux_stock").select("*").neq("statut", "fondu"),
      etat,
      OPTIONS
    ).range(etat.from, etat.to),
    supabase
      .from("lot_references")
      .select(
        `destination_stock_id,
        lot:lots!inner (
          type,
          dossier:dossiers!inner (
            client:clients!inner (
              civility, first_name, last_name
            )
          )
        )`
      )
      .not("destination_stock_id", "is", null),
  ]);

  const role = (profile?.role ?? "vendeur") as UserRole;

  // Build a lookup map: stock_id -> origin info
  const originMap = new Map<string, { client_name: string; type: string }>();
  for (const ref of originRefs ?? []) {
    if (!ref.destination_stock_id) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lot = ref.lot as any;
    const client = lot?.dossier?.client;
    if (client) {
      originMap.set(ref.destination_stock_id, {
        client_name: `${client.civility} ${client.first_name} ${client.last_name}`,
        type: lot.type,
      });
    }
  }

  const bijoux: BijouxStockWithOrigin[] = ((data ?? []) as BijouxStock[]).map((item) => {
    const origin = originMap.get(item.id);
    return {
      ...item,
      origin_client_name: origin?.client_name ?? null,
      origin_type: origin
        ? origin.type === "depot_vente" ? "depot_vente" : "rachat"
        : null,
    };
  });

  return (
    <PageWrapper title="Bijoux" fullHeight>
      <StockTable data={bijoux} canEdit={role === "proprietaire" || role === "super_admin"} totalItems={count ?? 0} />
    </PageWrapper>
  );
}
