import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W, fmt } from "./shared-styles";
import { piedDePage, enTeteDocument } from "./entete";
import { SOCIETE, type ClientInfo, type DossierInfo, type ReferenceLigne, recapitulatifTitrage } from "./blocks";

export interface RemboursementRetractationData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  references: ReferenceLigne[];
  /** Somme effectivement versée au client avant sa rétractation. */
  montantRembourse: number;
  /** Numéro du contrat de rachat annulé. */
  numeroContrat: string;
}

const TEXTE_RETRACTATION =
  "Le client a exercé son droit de rétractation dans le délai légal. " +
  "La vente est annulée de plein droit : les articles lui sont restitués et " +
  "les sommes qu'il avait perçues sont reversées à la société. " +
  "Le présent reçu atteste de ce remboursement et solde l'opération.";

function Doc({ data }: { data: RemboursementRetractationData }) {
  const { client, dossier, references, montantRembourse, numeroContrat } = data;
  const h = React.createElement;

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    // En-tête
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.companyName }, SOCIETE.nom.toUpperCase()),
        h(Text, { style: s.companyLine }, SOCIETE.adresse),
        h(Text, { style: s.companyLine }, SOCIETE.telephone))),
    // Client + identification du document
    enTeteDocument("REMBOURSEMENT", [
      { label: "NUMÉRO", value: data.numero },
      { label: "DATE", value: `${dossier.date}  ${dossier.heure}` },
      { label: "CONTRAT ANNULÉ", value: numeroContrat },
    ], client, dossier),
    // Articles restitués
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W.des }] }, "ARTICLE RESTITUÉ"),
        h(Text, { style: [s.th, { width: W.met }] }, "MÉTAL"),
        h(Text, { style: [s.th, { width: W.tit }] }, "TITRAGE"),
        h(Text, { style: [s.th, { width: W.poi, textAlign: "right" }] }, "POIDS"),
        h(Text, { style: [s.th, { width: W.qte, textAlign: "center" }] }, "QTÉ"),
        h(Text, { style: [s.th, { width: W.pt, textAlign: "right" }] }, "MONTANT ANNULÉ")),
      ...references.map((r, i) =>
        h(View, { key: i, style: s.tableRow },
          h(View, { style: { width: W.des } },
            h(Text, { style: s.tdBold }, r.designation),
            r.reference ? h(Text, { style: s.refLigne }, r.reference) : null),
          h(Text, { style: [s.td, { width: W.met }] }, r.metal),
          h(Text, { style: [s.td, { width: W.tit }] }, r.titrage && r.titrage !== "—" ? r.titrage : ""),
          h(Text, { style: [s.td, { width: W.poi, textAlign: "right" }] }, `${r.poids}g`),
          h(Text, { style: [s.td, { width: W.qte, textAlign: "center" }] }, String(r.quantite)),
          h(Text, { style: [s.tdBold, { width: W.pt, textAlign: "right" }] }, fmt(r.prixTotal))))),
    // Bas de page : mentions + montant remboursé
    h(View, { style: s.bottom },
      h(View, { style: s.bottomLeft },
        h(Text, { style: s.sectionLabel }, "R\u00C9CAPITULATIF"),
        h(Text, { style: s.recapText }, recapitulatifTitrage(references)),
        h(Text, { style: s.sectionLabel }, "R\u00C9TRACTATION"),
        h(Text, { style: s.condText }, TEXTE_RETRACTATION)),
      h(View, { style: s.bottomRight },
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.totSep }),
        // Le libellé tient sur sa propre ligne : « REMBOURSÉ PAR LE CLIENT »
        // en 12 pt gras dépasse à lui seul la largeur du bloc (200 pt) et
        // chevauchait le montant.
        h(View, { style: s.mb4 },
          h(Text, { style: s.sectionLabel }, "REMBOURSÉ PAR LE CLIENT")),
        h(View, { style: s.netRow },
          h(Text, { style: s.netLabel }, "TOTAL"),
          h(Text, { style: s.netValue }, fmt(montantRembourse))),
        h(View, { style: s.sigBlock },
          h(Text, { style: s.sigLabel }, "Signature du client"),
          h(View, { style: s.sigLine })))),
    // Pied de page
    piedDePage()));
}

export async function generateRemboursementRetractation(
  data: RemboursementRetractationData
): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
