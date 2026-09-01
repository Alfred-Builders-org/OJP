import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W, fmt } from "./shared-styles";
import { piedDePage, enTeteDocument } from "./entete";
import { TEXTE_DEVIS_VALIDITE, SOCIETE, type ClientInfo, type DossierInfo, type ReferenceLigne, type TotauxInfo, recapitulatifTitrage } from "./blocks";

export interface DevisRachatData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  references: ReferenceLigne[];
  totaux: TotauxInfo;
}

function Doc({ data }: { data: DevisRachatData }) {
  const { client, dossier, references, totaux } = data;
  const h = React.createElement;

  const recap = recapitulatifTitrage(references);

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.companyName }, SOCIETE.nom.toUpperCase()),
        h(Text, { style: s.companyLine }, SOCIETE.adresse),
        h(Text, { style: s.companyLine }, SOCIETE.telephone))),
    enTeteDocument("DEVIS", [
      { label: "NUM\u00C9RO", value: data.numero },
      { label: "DATE", value: `${dossier.date}  ${dossier.heure}` },
    ], client, dossier),
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W.des }] }, "D\u00C9SIGNATION"),
        h(Text, { style: [s.th, { width: W.met }] }, "M\u00C9TAL"),
        h(Text, { style: [s.th, { width: W.tit }] }, "TITRAGE"),
        h(Text, { style: [s.th, { width: W.poi, textAlign: "right" }] }, "POIDS"),
        h(Text, { style: [s.th, { width: W.qte, textAlign: "center" }] }, "QT\u00C9"),
        h(Text, { style: [s.th, { width: W.tax, textAlign: "center" }] }, "TAXE"),
        h(Text, { style: [s.th, { width: W.pu, textAlign: "right" }] }, "P.U BRUT"),
        h(Text, { style: [s.th, { width: W.pt, textAlign: "right" }] }, "P.T BRUT")),
      ...references.map((r, i) =>
        h(View, { key: i, style: s.tableRow },
          h(View, { style: { width: W.des } },
            h(Text, { style: s.tdBold }, r.designation),
            r.reference ? h(Text, { style: s.refLigne }, r.reference) : null),
          h(Text, { style: [s.td, { width: W.met }] }, r.metal),
          h(Text, { style: [s.td, { width: W.tit }] }, r.titrage && r.titrage !== "—" ? r.titrage : ""),
          h(Text, { style: [s.td, { width: W.poi, textAlign: "right" }] }, `${r.poids}g`),
          h(Text, { style: [s.td, { width: W.qte, textAlign: "center" }] }, String(r.quantite)),
          h(Text, { style: [s.td, { width: W.tax, textAlign: "center" }] }, r.taxe),
          h(Text, { style: [s.tdBold, { width: W.pu, textAlign: "right" }] }, fmt(r.prixUnitaire)),
          h(Text, { style: [s.tdBold, { width: W.pt, textAlign: "right" }] }, fmt(r.prixTotal))))),
    // Bottom 2 columns
    h(View, { style: s.bottom },
      h(View, { style: s.bottomLeft },
        h(Text, { style: s.sectionLabel }, "R\u00C9CAPITULATIF"),
        h(Text, { style: s.recapText }, recap),
        h(Text, { style: s.sectionLabel }, "VALIDIT\u00C9 DU DEVIS"),
        h(Text, { style: s.condText }, TEXTE_DEVIS_VALIDITE)),
      h(View, { style: s.bottomRight },
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "Subtotal"), h(Text, { style: s.totValue }, fmt(totaux.totalBrut))),
        h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, totaux.taxeLabel ?? "Taxe (TMP+CRDS)"), h(Text, { style: s.totValue }, fmt(totaux.taxe))),
        h(View, { style: s.totSep }),
        h(View, { style: s.netRow }, h(Text, { style: s.netLabel }, "TOTAL DEVIS"), h(Text, { style: s.netValue }, fmt(totaux.netAPayer))),
        h(View, { style: s.sigBlock }, h(Text, { style: s.sigLabel }, "Signature du vendeur"), h(View, { style: s.sigLine })))),
    piedDePage()));
}

export async function generateDevisRachat(data: DevisRachatData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
