import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W_FVE, C, fmt } from "./shared-styles";
import { piedDePage, blocIdentiteFacture } from "./entete";
import {
  TEXTE_CGV_ACOMPTE, type ClientInfo, type DossierInfo, type FactureVenteLigne,
} from "./blocks";

export interface FactureAcompteData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  lignes: FactureVenteLigne[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  acomptePourcentage: number;
  montantAcompte: number;
  montantSolde: number;
  dateLimiteSolde: string;
}

function Doc({ data }: { data: FactureAcompteData }) {
  const { client, dossier, lignes, totalHT, tva, totalTTC, acomptePourcentage, montantAcompte, montantSolde, dateLimiteSolde } = data;
  const h = React.createElement;

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    // Header
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.fveTitle }, "FACTURE D'ACOMPTE"),
        h(Text, { style: s.fveNumero }, `N\u00B0 ${data.numero}`))),

    // Reperes a gauche, identite du client a droite.
    h(View, { style: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const, marginBottom: 20 } },
      h(View, null,
        h(Text, { style: s.fveDateLeft }, `Date : ${dossier.date}  |  Heure : ${dossier.heure}`)),
      blocIdentiteFacture(client, dossier)),

    // Table - items de la commande
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W_FVE.titre }] }, "TITRE"),
        h(Text, { style: [s.th, { width: W_FVE.des }] }, "D\u00C9SIGNATION"),
        h(Text, { style: [s.th, { width: W_FVE.poids, textAlign: "right" }] }, "POIDS (G)"),
        h(Text, { style: [s.th, { width: W_FVE.qte, textAlign: "center" }] }, "QT\u00C9"),
        h(Text, { style: [s.th, { width: W_FVE.puHT, textAlign: "right" }] }, "P.U HT"),
        h(Text, { style: [s.th, { width: W_FVE.totalHT, textAlign: "right" }] }, "TOTAL HT")),
      ...lignes.map((r, i) =>
        h(View, { key: i, style: s.tableRow },
          h(Text, { style: [s.tdBold, { width: W_FVE.titre }] }, r.titre),
          h(Text, { style: [s.td, { width: W_FVE.des }] }, r.designation),
          h(Text, { style: [s.td, { width: W_FVE.poids, textAlign: "right" }] }, r.poids ? `${r.poids}` : ""),
          h(Text, { style: [s.td, { width: W_FVE.qte, textAlign: "center" }] }, String(r.quantite)),
          h(Text, { style: [s.tdBold, { width: W_FVE.puHT, textAlign: "right" }] }, fmt(r.prixUnitaireHT)),
          h(Text, { style: [s.tdBold, { width: W_FVE.totalHT, textAlign: "right" }] }, fmt(r.totalHT))))),

    // Totals with acompte breakdown
    h(View, { style: { alignItems: "flex-end", marginTop: 10 } },
      h(View, { style: { width: 240 } },
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TOTAL HT"), h(Text, { style: s.totValue }, fmt(totalHT))),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TVA"), h(Text, { style: s.totValue }, fmt(tva))),
        h(View, { style: s.totSep }),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TOTAL TTC"), h(Text, { style: s.totValue }, fmt(totalTTC))),
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.netRow },
          h(Text, { style: s.netLabel }, `ACOMPTE ${acomptePourcentage}%`),
          h(Text, { style: s.netValue }, fmt(montantAcompte))),
        h(View, { style: { marginTop: 6 } },
          h(View, { style: s.totRow },
            h(Text, { style: { ...s.totLabel, fontWeight: 700 } }, "Solde restant"),
            h(Text, { style: { ...s.totValue, fontWeight: 700 } }, fmt(montantSolde))),
          h(Text, { style: { fontSize: 6.5, color: C.gray, textAlign: "right", marginTop: 2 } }, `\u00C0 r\u00E9gler avant le ${dateLimiteSolde}`)))),

    // CGV
    h(View, { style: { marginTop: 30 } },
      h(Text, { style: s.fveCgvTitle }, "CONDITIONS"),
      h(Text, { style: s.fveCgvText }, TEXTE_CGV_ACOMPTE)),

    // Signature
    h(Text, { style: s.fveSigLabel }, "Signature :"),

    // Cut line
    h(View, { style: s.fveCutLine }),

    // Footer
    piedDePage()));
}

export async function generateFactureAcompte(data: FactureAcompteData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
