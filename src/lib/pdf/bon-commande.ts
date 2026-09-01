import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s } from "./shared-styles";
import { piedDePage } from "./entete";
import {
  TEXTE_CONDITIONS_BON_COMMANDE,
  type BonCommandeLigne,
  type FonderieInfo,
  type DossierInfo,
} from "./blocks";

export interface BonCommandeData {
  numero: string;
  dossier: DossierInfo;
  fonderie: FonderieInfo;
  lignes: BonCommandeLigne[];
}

function Doc({ data }: { data: BonCommandeData }) {
  const { dossier, fonderie, lignes } = data;
  const h = React.createElement;

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    // Header
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.docTitle }, "BON DE COMMANDE"),
        h(Text, { style: s.infoLabel }, "N°"),
        h(Text, { style: s.infoValue }, data.numero),
        h(Text, { style: s.infoLabel }, "DATE"),
        h(Text, { style: s.infoValue }, dossier.date),
      ),
    ),

    // Reperes du dossier a gauche, fournisseur a droite.
    h(View, { style: s.infoSection },
      h(View, { style: s.docLeft },
        h(View, { style: s.reperes },
          h(View, null,
            h(Text, { style: s.repereLabel }, "DOSSIER"),
            h(Text, { style: s.repereValue }, dossier.numeroDossier)),
          h(View, null,
            h(Text, { style: s.repereLabel }, "LOT"),
            h(Text, { style: s.repereValue }, dossier.numeroLot))),
      ),
      h(View, { style: s.clientBlock },
        h(Text, { style: s.label }, "FOURNISSEUR"),
        h(Text, { style: s.clientName }, fonderie.nom),
        fonderie.adresse ? h(Text, { style: s.clientLine }, fonderie.adresse) : null,
        fonderie.codePostal && fonderie.ville ? h(Text, { style: s.clientLine }, `${fonderie.codePostal} ${fonderie.ville}`) : null,
        fonderie.telephone ? h(Text, { style: s.clientMuted }, `T\u00E9l : ${fonderie.telephone}`) : null,
        fonderie.email ? h(Text, { style: s.clientMuted }, fonderie.email) : null,
      ),
    ),

    // Table — sans prix : c'est la fonderie qui chiffre, sur son devis
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { flex: 4 }] }, "DÉSIGNATION"),
        h(Text, { style: [s.th, { flex: 1.5, textAlign: "center" }] }, "MÉTAL"),
        h(Text, { style: [s.th, { flex: 1.5, textAlign: "right" }] }, "POIDS"),
        h(Text, { style: [s.th, { flex: 1, textAlign: "right" }] }, "QTÉ"),
      ),
      ...lignes.map((l, i) =>
        h(View, { key: i, style: s.tableRow },
          h(Text, { style: [s.tdBold, { flex: 4 }] }, l.designation),
          h(Text, { style: [s.td, { flex: 1.5, textAlign: "center" }] }, l.metal),
          h(Text, { style: [s.td, { flex: 1.5, textAlign: "right" }] }, `${l.poids}g`),
          h(Text, { style: [s.td, { flex: 1, textAlign: "right" }] }, String(l.quantite)),
        ),
      ),
    ),

    // Bottom
    h(View, { style: s.bottom },
      h(View, { style: s.bottomLeft },
        h(Text, { style: s.sectionLabel }, "CONDITIONS"),
        h(Text, { style: s.condText }, TEXTE_CONDITIONS_BON_COMMANDE),
      ),
    ),

    // Signature
    h(View, { style: s.sigBlock },
      h(Text, { style: s.sigLabel }, "Signature et cachet"),
      h(View, { style: s.sigLine }),
    ),

    // Footer
    piedDePage(data.numero),
  ));
}

export async function generateBonCommande(data: BonCommandeData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
