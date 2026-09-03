import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { CaissePageClient } from "@/components/caisse/caisse-page-client";
import { bornesDuJour, type MouvementCaisse } from "@/lib/reglements/caisse";

export const dynamic = "force-dynamic";

/**
 * La feuille de caisse du jour.
 *
 * Elle remplace le classeur tenu à la main : tous les mouvements d'argent d'une
 * journée, ventilés par moyen de paiement et par sens. Chaque ligne dit son lot
 * — statut, numéro, tiers — et le montant tombe dans sa case, avec un total en
 * regard.
 */

interface ReglementDuJour {
  id: string;
  sens: "entrant" | "sortant";
  type: MouvementCaisse["type"];
  mode: MouvementCaisse["mode"];
  montant: number;
  date_reglement: string;
  lot: {
    numero: string;
    type: string;
    status: string;
    outcome: string | null;
    dossier: {
      tiers_type: string | null;
      client: { first_name: string; last_name: string } | null;
      grossiste: { nom: string; raison_sociale: string | null } | null;
      fonderie: { nom: string } | null;
    } | null;
  } | null;
  client: { first_name: string; last_name: string } | null;
  fonderie: { nom: string } | null;
  reparation: {
    designation: string | null;
    bijou: { nom: string } | null;
    client: { first_name: string; last_name: string } | null;
  } | null;
  achat_grossiste: {
    numero: string;
    grossiste: { nom: string; raison_sociale: string | null } | null;
  } | null;
}

const SELECTION = `
  id, sens, type, mode, montant, date_reglement,
  lot:lots(
    numero, type, status, outcome,
    dossier:dossiers(
      tiers_type,
      client:clients(first_name, last_name),
      grossiste:grossistes(nom, raison_sociale),
      fonderie:fonderies(nom)
    )
  ),
  client:clients(first_name, last_name),
  fonderie:fonderies(nom),
  reparation:reparations(designation, bijou:bijoux_stock(nom), client:clients(first_name, last_name)),
  achat_grossiste:achats_grossiste(numero, grossiste:grossistes(nom, raison_sociale))
`;

/** Le tiers d'un règlement, quelle que soit sa nature. */
function tiersPour(r: ReglementDuJour): string {
  const d = r.lot?.dossier;
  if (d) {
    if (d.tiers_type === "grossiste") return d.grossiste?.raison_sociale ?? d.grossiste?.nom ?? "Grossiste";
    if (d.tiers_type === "fonderie") return d.fonderie?.nom ?? "Fonderie";
    if (d.client) return `${d.client.first_name} ${d.client.last_name}`.trim();
  }
  if (r.type === "reparation") {
    if (r.reparation?.client) return `${r.reparation.client.first_name} ${r.reparation.client.last_name}`.trim();
    return r.reparation?.designation ?? r.reparation?.bijou?.nom ?? "Réparation";
  }
  if (r.type === "achat_grossiste") {
    return r.achat_grossiste?.grossiste?.raison_sociale ?? r.achat_grossiste?.grossiste?.nom ?? "Fournisseur";
  }
  if (r.type === "fonderie") return r.fonderie?.nom ?? "Fonderie";
  if (r.client) return `${r.client.first_name} ${r.client.last_name}`.trim();
  return "—";
}

export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const params = await searchParams;
  const jour = params.jour?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? params.jour
    : new Date().toLocaleDateString("sv-SE");

  const { debut, fin } = bornesDuJour(jour);
  const supabase = await createClient();

  const { data } = await supabase
    .from("reglements")
    .select(SELECTION)
    .gte("date_reglement", debut)
    .lt("date_reglement", fin)
    .order("date_reglement", { ascending: true });

  const reglements = (data ?? []) as unknown as ReglementDuJour[];

  const mouvements: MouvementCaisse[] = reglements.map((r) => ({
    id: r.id,
    sens: r.sens,
    type: r.type,
    mode: r.mode,
    montant: Number(r.montant),
    date_reglement: r.date_reglement,
    numero_lot: r.lot?.numero ?? r.achat_grossiste?.numero ?? null,
    lot_status: r.lot?.status ?? null,
    lot_outcome: r.lot?.outcome ?? null,
    lot_type: r.lot?.type ?? (r.type === "reparation" ? "reparation" : r.type === "achat_grossiste" ? "achat" : null),
    tiers: tiersPour(r),
  }));

  return (
    <PageWrapper title="Feuille de caisse" fullHeight>
      <CaissePageClient jour={jour} mouvements={mouvements} />
    </PageWrapper>
  );
}
