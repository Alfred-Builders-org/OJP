export interface SearchResult {
  entity_type:
    | "client"
    | "dossier"
    | "lot"
    | "reference"
    | "vente"
    | "bijoux"
    | "confie_achat"
    | "or_investissement";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export const ENTITY_LABELS: Record<SearchResult["entity_type"], string> = {
  client: "Clients",
  dossier: "Dossiers",
  lot: "Rachat",
  reference: "Références",
  vente: "Ventes",
  bijoux: "Bijoux",
  confie_achat: "Confié d'achat",
  or_investissement: "Or Investissement",
};
