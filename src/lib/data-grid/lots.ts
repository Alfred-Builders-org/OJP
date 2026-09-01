import {
  lireParams,
  appliquerFiltres,
  clauseAvecClient,
  type ParamsTableau,
  type OptionsRequete,
} from "@/lib/data-grid/query";
import type { LotWithDossier } from "@/types/lot";

const OPTIONS: OptionsRequete = {
  // La recherche par nom de client passe par la clause construite ci-dessous.
  colonnesRecherche: [],
  colonnesFiltres: { statut: "status" },
  colonnesTri: {
    numero: "numero",
    statut: "status",
    prix: "total_prix_achat",
    prix_vente: "total_prix_revente",
    date: "created_at",
  },
  triParDefaut: { colonne: "created_at", ascendant: false },
};

/**
 * Chargement d'une liste de lots, filtrée côté serveur.
 *
 * Les pages Rachat et Dépôt-vente ne diffèrent que par le type de lot et le
 * chemin de destination : la requête est écrite une fois.
 */
export async function chargerLots(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  params: ParamsTableau,
  type: "rachat" | "depot_vente" | "vente",
  selection: string
): Promise<{ lots: LotWithDossier[]; count: number }> {
  const etat = lireParams(params);

  // Un lot se cherche par son numéro, mais aussi par le nom de son client :
  // on résout d'abord les dossiers concernés.
  let clause: string | null = null;
  if (etat.search) {
    const terme = etat.search.replace(/[(),]/g, " ").trim();
    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .or(`first_name.ilike.%${terme}%,last_name.ilike.%${terme}%`)
      .limit(200);

    const clientIds = (clients ?? []).map((c: { id: string }) => c.id);
    let dossierIds: string[] = [];
    if (clientIds.length) {
      const { data: dossiers } = await supabase
        .from("dossiers")
        .select("id")
        .in("client_id", clientIds)
        .limit(500);
      dossierIds = (dossiers ?? []).map((d: { id: string }) => d.id);
    }

    clause = clauseAvecClient(terme, "numero", "dossier_id", dossierIds);
  }

  const etatSansRecherche = { ...etat, search: "" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avecRecherche = (q: any) => (clause ? q.or(clause) : q);

  const [{ count }, { data }] = await Promise.all([
    avecRecherche(
      appliquerFiltres(
        supabase.from("lots").select("*", { count: "exact", head: true }).eq("type", type),
        etatSansRecherche,
        { ...OPTIONS, triParDefaut: undefined }
      )
    ),
    avecRecherche(
      appliquerFiltres(
        supabase.from("lots").select(selection).eq("type", type),
        etatSansRecherche,
        OPTIONS
      )
    ).range(etat.from, etat.to),
  ]);

  return { lots: (data ?? []) as LotWithDossier[], count: count ?? 0 };
}
