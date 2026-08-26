import { createClient } from "@/lib/supabase/server";
import { LOT_REF_WITH_TAX_DATA, FACTURE_WITH_TAX_DATA } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ImpotsTable } from "@/components/impots/impots-table";
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

  return (
    <PageWrapper title="Impôts" fullHeight>
      <ImpotsTable data={allTaxes} />
    </PageWrapper>
  );
}
