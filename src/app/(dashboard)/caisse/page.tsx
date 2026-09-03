import { createClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { CaissePageClient } from "@/components/caisse/caisse-page-client";
import { bornesDuJour, type MouvementCaisse } from "@/lib/reglements/caisse";

export const dynamic = "force-dynamic";

/**
 * La feuille de caisse du jour.
 *
 * Elle remplace le classeur tenu a la main : tous les mouvements d'argent d'une
 * journee, ventiles par moyen de paiement et par sens. Elle ne calcule aucun
 * resultat — elle constate ce qui est passe par le tiroir, comme le faisait la
 * feuille papier qu'on remplissait le soir.
 *
 * Elle lit la table des reglements, et rien d'autre : depuis que celle-ci
 * accueille les reparations et les achats grossistes, elle contient la journee
 * entiere.
 */

/** Forme des lignes rapportees par la selection ci-dessous. */
interface ReglementDuJour {
  id: string;
  sens: "entrant" | "sortant";
  type: MouvementCaisse["type"];
  mode: MouvementCaisse["mode"];
  montant: number;
  date_reglement: string;
  notes: string | null;
  lot: { numero: string; dossier: { client: { first_name: string; last_name: string } | null } | null } | null;
  client: { first_name: string; last_name: string } | null;
  fonderie: { nom: string } | null;
  reparation: { designation: string | null; bijou: { nom: string } | null } | null;
  achat_grossiste: { numero: string; grossiste: { nom: string } | null } | null;
}

const SELECTION = `
  id, sens, type, mode, montant, date_reglement, notes,
  lot:lots(numero, dossier:dossiers(client:clients(first_name, last_name))),
  client:clients(first_name, last_name),
  fonderie:fonderies(nom),
  reparation:reparations(designation, bijou:bijoux_stock(nom)),
  achat_grossiste:achats_grossiste(numero, grossiste:grossistes(nom))
`;

/** Qui, ou quoi, se trouve derriere un mouvement. */
function libellePour(r: ReglementDuJour): string {
  const client = r.lot?.dossier?.client ?? r.client;
  if (r.type === "reparation") {
    const objet = r.reparation?.designation ?? r.reparation?.bijou?.nom;
    return objet ? `Réparation — ${objet}` : "Réparation";
  }
  if (r.type === "achat_grossiste") {
    return r.achat_grossiste?.grossiste?.nom ?? "Achat fournisseur";
  }
  if (r.type === "fonderie") return r.fonderie?.nom ?? "Fonderie";
  if (client) return `${client.first_name} ${client.last_name}`.trim();
  return "—";
}

function referencePour(r: ReglementDuJour): string | null {
  return r.lot?.numero ?? r.achat_grossiste?.numero ?? null;
}

export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const params = await searchParams;
  // Sans date demandee, la feuille du jour : c'est celle qu'on ouvre le matin
  // et qu'on garde sous les yeux.
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

  // Le numero d'ordre au livre de police — la colonne « enregistre » du
  // classeur — se lit sur les references du lot. Une seule requete pour toute
  // la journee plutot qu'une par ligne.
  const numerosLot = reglements.map((r) => r.lot?.numero).filter(Boolean) as string[];
  const registreParLot = new Map<string, number>();
  if (numerosLot.length > 0) {
    const { data: entrees } = await supabase
      .from("registre_objets")
      .select("numero_ordre, reference")
      .in("reference", numerosLot);
    for (const entree of entrees ?? []) {
      const ref = entree.reference as string;
      const numero = entree.numero_ordre as number;
      // Un lot peut poser plusieurs objets au registre : on retient le premier,
      // celui par lequel l'operation a ete enregistree.
      if (!registreParLot.has(ref) || registreParLot.get(ref)! > numero) {
        registreParLot.set(ref, numero);
      }
    }
  }

  const mouvements: MouvementCaisse[] = reglements.map((r) => ({
    id: r.id,
    sens: r.sens,
    type: r.type,
    mode: r.mode,
    montant: Number(r.montant),
    date_reglement: r.date_reglement,
    libelle: libellePour(r),
    reference: referencePour(r),
    numero_registre: r.lot?.numero ? registreParLot.get(r.lot.numero) ?? null : null,
  }));

  return (
    <PageWrapper title="Feuille de caisse">
      <CaissePageClient jour={jour} mouvements={mouvements} />
    </PageWrapper>
  );
}
