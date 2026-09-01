import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W_QDV, fmt } from "./shared-styles";
import { piedDePage, enTeteDocument } from "./entete";
import {
  TEXTE_CONDITIONS_QUITTANCE_DV, SOCIETE,
  type ClientInfo, type DossierInfo, type QuittanceDepotVenteLigne,
} from "./blocks";

export interface QuittanceDepotVenteData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  lignes: QuittanceDepotVenteLigne[];
  totalVentes: number;
  totalCommission: number;
  netAPayer: number;
  venteDossierNumero: string;
}

function Doc({ data }: { data: QuittanceDepotVenteData }) {
  const { client, dossier, lignes, totalVentes, totalCommission, netAPayer } = data;
  const h = React.createElement;

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    // Header
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.companyName }, SOCIETE.nom.toUpperCase()),
        h(Text, { style: s.companyLine }, SOCIETE.adresse),
        h(Text, { style: s.companyLine }, SOCIETE.telephone))),
    // Info
    enTeteDocument("QUITTANCE D\u00C9P\u00D4T-VENTE", [
      { label: "NUM\u00C9RO", value: data.numero },
      { label: "DATE", value: `${dossier.date}  ${dossier.heure}` },
      { label: "VENTE", value: data.venteDossierNumero },
    ], client, dossier, "D\u00C9POSANT"),
    // Table
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W_QDV.des }] }, "D\u00C9SIGNATION"),
        h(Text, { style: [s.th, { width: W_QDV.desc }] }, "DESCRIPTION"),
        h(Text, { style: [s.th, { width: W_QDV.prixVente, textAlign: "right" }] }, "PRIX VENTE"),
        h(Text, { style: [s.th, { width: W_QDV.commission, textAlign: "right" }] }, "COMMISSION"),
        h(Text, { style: [s.th, { width: W_QDV.netDeposant, textAlign: "right" }] }, "NET D\u00C9POSANT")),
      ...lignes.map((r, i) =>
        h(View, { key: i, style: s.tableRow },
          h(Text, { style: [s.tdBold, { width: W_QDV.des }] }, r.designation),
          h(Text, { style: [s.td, { width: W_QDV.desc }] }, r.description),
          h(Text, { style: [s.td, { width: W_QDV.prixVente, textAlign: "right" }] }, fmt(r.prixVentePublic)),
          h(Text, { style: [s.td, { width: W_QDV.commission, textAlign: "right" }] }, fmt(r.commission)),
          h(Text, { style: [s.tdBold, { width: W_QDV.netDeposant, textAlign: "right" }] }, fmt(r.netDeposant))))),
    // Bottom 2 columns
    h(View, { style: s.bottom },
      h(View, { style: s.bottomLeft },
        h(Text, { style: s.sectionLabel }, "CONDITIONS"),
        h(Text, { style: s.condText }, TEXTE_CONDITIONS_QUITTANCE_DV)),
      h(View, { style: s.bottomRight },
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "Total ventes"), h(Text, { style: s.totValue }, fmt(totalVentes))),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "Commission"), h(Text, { style: s.totValue }, `-${fmt(totalCommission)}`)),
        h(View, { style: s.totSep }),
        h(View, { style: s.netRow }, h(Text, { style: s.netLabel }, "NET \u00C0 PAYER"), h(Text, { style: s.netValue }, fmt(netAPayer))),
        h(View, { style: s.sigBlock }, h(Text, { style: s.sigLabel }, "Signature du d\u00E9posant"), h(View, { style: s.sigLine })))),
    // Footer
    piedDePage()));
}

export async function generateQuittanceDepotVente(data: QuittanceDepotVenteData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
