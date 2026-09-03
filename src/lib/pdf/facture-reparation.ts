import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W_FVE, fmt } from "./shared-styles";
import { piedDePage, blocIdentiteFacture } from "./entete";
import type { ClientInfo, DossierInfo } from "./blocks";

/** Taux de TVA d'une prestation de service. Une réparation n'est pas une revente. */
export const TVA_REPARATION = 0.2;

export interface FactureReparationData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  designation: string;
  /** Détail du travail, imprimé sous la désignation. */
  travail?: string;
  /** Prix TTC demandé au client (celui saisi sur la fiche). */
  prixTTC: number;
  modeReglement?: string;
}

function Doc({ data }: { data: FactureReparationData }) {
  const { client, dossier, designation, travail, prixTTC } = data;
  const h = React.createElement;

  // Le prix affiché au comptoir est celui que le client paie, TVA comprise. On
  // en déduit la base et la taxe pour la facture.
  const ht = Math.round((prixTTC / (1 + TVA_REPARATION)) * 100) / 100;
  const tva = Math.round((prixTTC - ht) * 100) / 100;

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.fveTitle }, "FACTURE DE RÉPARATION"),
        h(Text, { style: s.fveNumero }, `N° ${data.numero}`))),

    h(View, { style: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const, marginBottom: 20 } },
      h(View, null,
        h(Text, { style: s.fveDateLeft }, `Date : ${dossier.date}  |  Heure : ${dossier.heure}`),
        h(Text, { style: s.fveDateLeft }, `Paiement : ${data.modeReglement || "—"}`)),
      blocIdentiteFacture(client, dossier)),

    // Une ligne de prestation : désignation, quantité 1, prix HT.
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W_FVE.des + W_FVE.titre }] }, "PRESTATION"),
        h(Text, { style: [s.th, { width: W_FVE.poids, textAlign: "center" }] }, "QTÉ"),
        h(Text, { style: [s.th, { width: W_FVE.puHT, textAlign: "right" }] }, "P.U HT"),
        h(Text, { style: [s.th, { width: W_FVE.totalHT, textAlign: "right" }] }, "TOTAL HT")),
      h(View, { style: s.tableRow },
        h(View, { style: { width: W_FVE.des + W_FVE.titre } },
          h(Text, { style: s.tdBold }, designation),
          travail ? h(Text, { style: [s.td, { color: "#777777" }] }, travail) : null),
        h(Text, { style: [s.td, { width: W_FVE.poids, textAlign: "center" }] }, "1"),
        h(Text, { style: [s.tdBold, { width: W_FVE.puHT, textAlign: "right" }] }, fmt(ht)),
        h(Text, { style: [s.tdBold, { width: W_FVE.totalHT, textAlign: "right" }] }, fmt(ht)))),

    // Totaux avec TVA normale.
    h(View, { style: { alignItems: "flex-end", marginTop: 10 } },
      h(View, { style: { width: 200 } },
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TOTAL HT"), h(Text, { style: s.totValue }, fmt(ht))),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TVA 20 %"), h(Text, { style: s.totValue }, fmt(tva))),
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.netRow },
          h(Text, { style: s.netLabel }, "TOTAL TTC"),
          h(Text, { style: s.netValue }, fmt(prixTTC))))),

    h(Text, { style: s.fveSigLabel }, "Signature :"),
    h(View, { style: s.fveCutLine }),
    piedDePage()));
}

export async function generateFactureReparation(data: FactureReparationData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
