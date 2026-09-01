import { createClient } from "@/lib/supabase/server";
import { LOT_REF_WITH_TAX_DATA, FACTURE_WITH_TAX_DATA } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ImpotsPageClient } from "@/components/impots/impots-page-client";
import { ligneSousMarge } from "@/lib/pdf/facture-vente-regime";
import type {
  AchatSousMarge,
  VenteSousMarge,
} from "@/lib/calculations/registre-marge";
import type { TaxeRow } from "@/types/impots";
import type { RegimeFiscal } from "@/types/lot";

/**
 * Forme des lignes rendues par LOT_REF_WITH_TAX_DATA et FACTURE_WITH_TAX_DATA.
 * Le client Supabase n'est pas typé sur le schéma : ces interfaces décrivent
 * la chaîne lot -> dossier -> client que les deux sélections rapportent.
 */
type ClientChain = {
  id: string;
  civility: string;
  first_name: string;
  last_name: string;
};

type LotChain = {
  id: string;
  numero: string;
  status?: string;
  date_finalisation?: string | null;
  dossier: { id: string; numero: string; client: ClientChain | null } | null;
} | null;

interface RefWithTax {
  id: string;
  prix_achat: number;
  regime_fiscal: RegimeFiscal;
  montant_taxe: number;
  created_at: string;
  lot: LotChain;
}

interface FactureWithTax {
  id: string;
  numero: string;
  montant_ht: number;
  montant_taxe: number;
  date_emission: string;
  lot: LotChain;
}

export default async function ImpotsPage() {
  const supabase = await createClient();

  // Fetch rachat taxes (lot_references with regime_fiscal set, from finalized lots)
  const { data: refData } = await supabase
    .from("lot_references")
    .select(LOT_REF_WITH_TAX_DATA)
    .not("regime_fiscal", "is", null)
    .gt("montant_taxe", 0);

  // Fetch vente taxes (factures with TVA)
  const { data: factureData } = await supabase
    .from("factures")
    .select(FACTURE_WITH_TAX_DATA)
    .gt("montant_taxe", 0);

  // Transform rachat references into unified TaxeRow
  const rachatRows: TaxeRow[] = ((refData ?? []) as unknown as RefWithTax[]).flatMap((ref) => {
    const lot = ref.lot;
    const client = lot?.dossier?.client;
    if (!lot || !client || lot.status === "brouillon") return [];
    const civility = client.civility === "M" ? "M." : "Mme";
    return [
      {
        id: `ref-${ref.id}`,
        date: lot.date_finalisation ?? ref.created_at,
        reference: lot.numero,
        client_name: `${civility} ${client.first_name} ${client.last_name}`,
        type: ref.regime_fiscal,
        montant_brut: ref.prix_achat,
        montant_taxe: ref.montant_taxe,
        source_type: "rachat" as const,
        source_id: lot.id,
      },
    ];
  });

  // Transform factures into unified TaxeRow
  const venteRows: TaxeRow[] = ((factureData ?? []) as unknown as FactureWithTax[]).flatMap((f) => {
    const lot = f.lot;
    const client = lot?.dossier?.client;
    if (!lot || !client) return [];
    const civility = client.civility === "M" ? "M." : "Mme";
    return [
      {
        id: `fac-${f.id}`,
        date: f.date_emission,
        reference: f.numero,
        client_name: `${civility} ${client.first_name} ${client.last_name}`,
        type: "TVA" as const,
        montant_brut: f.montant_ht,
        montant_taxe: f.montant_taxe,
        source_type: "vente" as const,
        source_id: lot.id,
      },
    ];
  });

  // Merge and sort by date descending
  const allTaxes = [...rachatRows, ...venteRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const { ventes, achats } = await chargerMouvementsSousMarge(supabase);

  return (
    <PageWrapper title="Impôts" fullHeight>
      <ImpotsPageClient taxes={allTaxes} ventes={ventes} achats={achats} />
    </PageWrapper>
  );
}

/**
 * Forme des lignes de vente sous marge, telles que la selection les rapporte.
 */
interface LigneVenteMarge {
  id: string;
  designation: string | null;
  prix_total: number;
  montant_taxe: number;
  prix_achat_origine: number | null;
  type_taxe: "tva_marge" | "tva_normale" | "tfop" | null;
  or_investissement_id: string | null;
  bijou: { prix_achat: number | null; depot_vente_lot_id: string | null } | null;
  lot: {
    numero: string;
    type: string;
    status: string;
    date_finalisation: string | null;
    created_at: string;
  } | null;
}

interface ArticleStockMarge {
  id: string;
  nom: string;
  prix_achat: number | null;
  date_creation: string;
  created_at: string;
  depot_vente_lot_id: string | null;
}

/**
 * Les mouvements qui alimentent le registre de la marge.
 *
 * Une vente y entre quand elle releve du regime — donc toutes celles qui ne
 * sont pas taxees sur le prix entier, y compris celles a perte : ce sont
 * justement elles qui font la difference entre les deux methodes.
 *
 * Un achat y entre a la date ou la boutique a paye. Pour un rachat ou un achat
 * chez un grossiste, c'est l'entree en stock. Pour un depot-vente, la boutique
 * n'achete qu'en vendant : l'article ne compte donc qu'a cette date-la, et par
 * son net deposant.
 */
async function chargerMouvementsSousMarge(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ ventes: VenteSousMarge[]; achats: AchatSousMarge[] }> {
  const { data: ligneData } = await supabase
    .from("vente_lignes")
    .select(
      "id, designation, prix_total, montant_taxe, prix_achat_origine, type_taxe, or_investissement_id, bijou:bijoux_stock(prix_achat, depot_vente_lot_id), lot:lots(numero, type, status, date_finalisation, created_at)"
    )
    .is("or_investissement_id", null);

  const ventes: VenteSousMarge[] = [];
  const achatsDepotVente: AchatSousMarge[] = [];

  for (const l of (ligneData ?? []) as unknown as LigneVenteMarge[]) {
    const lot = l.lot;
    if (!lot || lot.type !== "vente" || lot.status === "brouillon") continue;
    if (!ligneSousMarge(l) || l.type_taxe === "tfop") continue;

    // Le prix d'achat fige prime : une correction ulterieure de la fiche stock
    // ne doit pas deplacer une marge deja declaree.
    const prixAchat = l.prix_achat_origine ?? l.bijou?.prix_achat ?? 0;
    const date = lot.date_finalisation ?? lot.created_at;
    ventes.push({
      id: l.id,
      date,
      reference: lot.numero,
      designation: l.designation ?? "Article",
      prixVente: l.prix_total,
      prixAchat,
    });

    if (l.bijou?.depot_vente_lot_id && prixAchat > 0) {
      achatsDepotVente.push({
        id: `dv-${l.id}`,
        date,
        designation: l.designation ?? "Article",
        prixAchat,
      });
    }
  }

  const { data: stockData } = await supabase
    .from("bijoux_stock")
    .select("id, nom, prix_achat, date_creation, created_at, depot_vente_lot_id")
    .eq("regime_tva_revente", "marge")
    .is("depot_vente_lot_id", null)
    .gt("prix_achat", 0);

  const achats: AchatSousMarge[] = ((stockData ?? []) as ArticleStockMarge[]).map((a) => ({
    id: a.id,
    date: a.date_creation ?? a.created_at,
    designation: a.nom,
    prixAchat: a.prix_achat ?? 0,
  }));

  return { ventes, achats: [...achats, ...achatsDepotVente] };
}
