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
  colonnesRecherche: ["nom", "description", "metaux", "qualite", "reference", "reference_fournisseur"],
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

  // La provenance n'est pas une colonne : elle se lit dans deux clés étrangères.
  // Un dépôt-vente porte `depot_vente_lot_id`, un achat grossiste porte
  // `grossiste_id`, un rachat n'a ni l'un ni l'autre. Le filtre est donc appliqué
  // à la main, hors du helper générique.
  const provenances = etat.filtres.provenance ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtrerProvenance = <T extends { not: any; is: any; or: any }>(q: T): T => {
    if (provenances.length === 0 || provenances.length === 3) return q;
    const clauses: string[] = [];
    if (provenances.includes("depot_vente")) clauses.push("depot_vente_lot_id.not.is.null");
    if (provenances.includes("grossiste")) clauses.push("grossiste_id.not.is.null");
    if (provenances.includes("rachat")) {
      clauses.push("and(depot_vente_lot_id.is.null,grossiste_id.is.null)");
    }
    return clauses.length ? q.or(clauses.join(",")) : q;
  };

  // Retirée des filtres génériques : elle ne correspond à aucune colonne.
  const etatSansProvenance = {
    ...etat,
    filtres: Object.fromEntries(
      Object.entries(etat.filtres).filter(([cle]) => cle !== "provenance")
    ),
  };

  // Un seul inventaire, toutes provenances confondues : rachats, depots-vente et
  // achats grossistes. Seul « fondu » est exclu — cette marchandise n'existe
  // plus. Les deux filtres precedents (`depot_vente_lot_id IS NULL` et
  // l'exclusion de « a_fondre ») rendaient invisibles les articles justement
  // crees par un rachat ou un depot-vente.
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { count }, { data }, { data: originRefs }, { data: grossistes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single(),
    filtrerProvenance(
      appliquerFiltres(
        supabase
          .from("bijoux_stock")
          .select("*", { count: "exact", head: true })
          .neq("statut", "fondu"),
        etatSansProvenance,
        { ...OPTIONS, triParDefaut: undefined }
      )
    ),
    filtrerProvenance(
      appliquerFiltres(
        supabase.from("bijoux_stock").select("*").neq("statut", "fondu"),
        etatSansProvenance,
        OPTIONS
      )
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
    supabase.from("grossistes").select("id, nom"),
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

  // Un bijou neuf n'a pas de vendeur : sa provenance est le grossiste chez qui
  // il a ete achete.
  const grossisteMap = new Map(
    (grossistes ?? []).map((g) => [g.id, g.nom as string])
  );

  const bijoux: BijouxStockWithOrigin[] = ((data ?? []) as BijouxStock[]).map((item) => {
    const origin = originMap.get(item.id);
    if (origin) {
      return {
        ...item,
        origin_client_name: origin.client_name,
        origin_type: origin.type === "depot_vente" ? "depot_vente" : "rachat",
      };
    }
    const grossiste = item.grossiste_id ? grossisteMap.get(item.grossiste_id) : null;
    return {
      ...item,
      origin_client_name: grossiste ?? null,
      origin_type: grossiste ? "grossiste" : null,
    };
  });

  return (
    <PageWrapper title="Stock" fullHeight>
      <StockTable data={bijoux} canEdit={role === "proprietaire" || role === "super_admin"} totalItems={count ?? 0} />
    </PageWrapper>
  );
}
