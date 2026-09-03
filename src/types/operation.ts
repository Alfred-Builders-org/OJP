import type { LotType, LotStatus, LotOutcome } from "@/types/lot";

/** Une facture rattachee a une operation. */
export interface OperationFacture {
  id: string;
  numero: string;
  montant_ttc: number;
}

/**
 * Une operation telle que la liste globale la montre : le lot, son client, et
 * les factures qui en sont sorties.
 */
export interface OperationRow {
  id: string;
  numero: string;
  type: LotType;
  status: LotStatus;
  outcome: LotOutcome | null;
  created_at: string;
  date_finalisation: string | null;
  total_prix_achat: number | null;
  total_prix_revente: number | null;
  dossier: {
    id: string;
    numero: string;
    client: { id: string; first_name: string; last_name: string } | null;
  } | null;
  factures: OperationFacture[];
}
