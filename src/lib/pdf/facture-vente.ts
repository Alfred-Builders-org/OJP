import React from "react";
import { Document, Page, View, Text, pdf, Image } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./logo";
import { styles as s, W_FVE, C, fmt } from "./shared-styles";
import {
  SOCIETE,
  type ClientInfo, type DossierInfo, type FactureVenteLigne, } from "./blocks";
import { MENTION_TVA_MARGE } from "@/lib/calculations/taxes";

export interface FactureVenteData {
  numero: string;
  client: ClientInfo;
  dossier: DossierInfo;
  lignes: FactureVenteLigne[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  /**
   * Toutes les lignes relevent du regime de la marge : ni HT ni TVA ne sont
   * ventiles sur la facture.
   */
  regimeMarge?: boolean;
  /**
   * Au moins une ligne releve de ce regime : la mention du 297 A est obligatoire,
   * meme si la facture ventile par ailleurs la TVA d'articles qui n'en relevent
   * pas. Se deduit de regimeMarge quand il n'est pas fourni.
   */
  mentionMarge?: boolean;
  modeReglement: string;
}

function Doc({ data }: { data: FactureVenteData }) {
  const { client, dossier, lignes, totalHT, tva, totalTTC } = data;
  const h = React.createElement;
  const fullName = `${client.civilite} ${client.prenom} ${client.nom}`;

  // Une facture peut melanger un bijou d'occasion et un bijou neuf. On ne
  // ventile alors que la TVA des seconds, et les premiers portent un renvoi
  // vers la mention du 297 A. Le prix affiche, lui, est toujours celui paye :
  // l'entete des colonnes ne peut annoncer « HT » que si tout se ventile.
  const mentionMarge = data.mentionMarge ?? data.regimeMarge ?? false;
  const mixte = mentionMarge && !data.regimeMarge;
  const enteteMontant = data.regimeMarge || mixte ? "" : " HT";
  const RENVOI = " (*)";

  return h(Document, null, h(Page, { size: "A4", style: s.page },
    // Header: Logo left, Title right
    h(View, { style: s.header },
      h(Image, { style: s.logo, src: LOGO_BASE64 }),
      h(View, { style: s.headerRight },
        h(Text, { style: s.fveTitle }, "FACTURE DE VENTE"),
        h(Text, { style: s.fveNumero }, `N\u00B0 ${data.numero}`))),

    // Client box with gold left border
    h(View, { style: s.fveClientBox },
      h(Text, { style: { fontSize: 6.5, fontFamily: "Courier-Bold", color: C.gray, marginBottom: 3, letterSpacing: 0.5 } }, "CLIENT"),
      h(Text, { style: { fontSize: 10, fontFamily: "Courier-Bold", color: C.black, marginBottom: 1 } }, fullName),
      client.adresse ? h(Text, { style: { fontSize: 8, color: C.gray, marginBottom: 1 } }, client.adresse) : null,
      (client.codePostal || client.ville)
        ? h(Text, { style: { fontSize: 8, color: C.gray, marginBottom: 1 } }, [client.codePostal, client.ville].filter(Boolean).join(" "))
        : null,
      client.documentType && client.documentNumber
        ? h(Text, { style: { fontSize: 7, color: C.grayLight, marginTop: 2 } }, `${client.documentType} : ${client.documentNumber}`)
        : null,
      h(Text, { style: { fontSize: 7, color: C.grayLight, marginTop: 1 } }, `Dossier : ${dossier.numeroDossier}`)),

    // Date / Heure / Paiement (right-aligned)
    h(View, { style: { alignItems: "flex-end", marginBottom: 20 } },
      h(Text, { style: s.fveDateRow }, `Date : ${dossier.date} | Heure : ${dossier.heure}`),
      h(Text, { style: s.fveDateRow }, `Paiement : ${data.modeReglement || ""}`)),

    // Table
    h(View, { style: s.tableWrap },
      h(View, { style: s.tableHead },
        h(Text, { style: [s.th, { width: W_FVE.titre }] }, "TITRE"),
        h(Text, { style: [s.th, { width: W_FVE.des }] }, "D\u00C9SIGNATION"),
        h(Text, { style: [s.th, { width: W_FVE.poids, textAlign: "right" }] }, "POIDS (G)"),
        h(Text, { style: [s.th, { width: W_FVE.qte, textAlign: "center" }] }, "QT\u00C9"),
        h(Text, { style: [s.th, { width: W_FVE.puHT, textAlign: "right" }] }, `P.U${enteteMontant}`),
        h(Text, { style: [s.th, { width: W_FVE.totalHT, textAlign: "right" }] }, `TOTAL${enteteMontant}`)),
      ...lignes.map((r, i) =>
        h(View, { key: i, style: s.tableRow },
          h(Text, { style: [s.tdBold, { width: W_FVE.titre }] }, r.titre),
          h(Text, { style: [s.td, { width: W_FVE.des }] },
            mixte && r.sousMarge ? `${r.designation}${RENVOI}` : r.designation),
          h(Text, { style: [s.td, { width: W_FVE.poids, textAlign: "right" }] }, r.poids ? `${r.poids}` : ""),
          h(Text, { style: [s.td, { width: W_FVE.qte, textAlign: "center" }] }, String(r.quantite)),
          h(Text, { style: [s.tdBold, { width: W_FVE.puHT, textAlign: "right" }] }, fmt(r.prixUnitaireHT)),
          h(Text, { style: [s.tdBold, { width: W_FVE.totalHT, textAlign: "right" }] }, fmt(r.totalHT))))),

    // Totals (right-aligned)
    // Sous le regime de la marge, la TVA n'apparait pas : elle n'est pas
    // recuperable par l'acquereur, et la ventiler reviendrait a lui indiquer le
    // prix d'achat du bien. Sur une facture mixte, seule celle des articles qui
    // n'en relevent pas se mentionne, et sans total HT — il n'aurait de sens que
    // sur une partie des lignes.
    h(View, { style: { alignItems: "flex-end", marginTop: 10 } },
      h(View, { style: { width: 200 } },
        data.regimeMarge || mixte
          ? null
          : h(View, { style: s.totRow }, h(Text, { style: s.totLabel }, "TOTAL HT"), h(Text, { style: s.totValue }, fmt(totalHT))),
        data.regimeMarge
          ? null
          : h(View, { style: s.totRow },
              h(Text, { style: s.totLabel }, mixte ? "DONT TVA" : "TVA"),
              h(Text, { style: s.totValue }, fmt(tva))),
        h(View, { style: s.totGoldLine }),
        h(View, { style: s.netRow },
          h(Text, { style: s.netLabel }, data.regimeMarge || mixte ? "TOTAL À PAYER" : "TOTAL TTC"),
          h(Text, { style: s.netValue }, fmt(totalTTC))))),

    // Mention obligatoire du regime particulier.
    //
    // C'est la SEULE mention fiscale que porte une facture sous ce regime. Les
    // conditions generales de vente imprimees ici parlaient d'or
    // d'investissement, d'exoneration et d'autoliquidation : trois mentions de
    // taxe etrangeres a un bijou, sur une facture qui ne doit en porter aucune.
    // Elles restent sur les factures d'acompte et de solde, ou elles sont vraies.
    mentionMarge
      ? h(View, { style: { marginTop: 20 } },
          h(Text, { style: s.fveCgvText },
            mixte ? `(*) ${MENTION_TVA_MARGE}` : MENTION_TVA_MARGE))
      : null,

    // Signature
    h(Text, { style: s.fveSigLabel }, "Signature :"),

    // Cut line
    h(View, { style: s.fveCutLine }),

    // Footer
    h(View, { style: s.footer, fixed: true },
      h(Text, { style: s.footerText }, `${SOCIETE.nom}`),
      h(Text, { style: s.footerText }, `${SOCIETE.adresse}  \u00B7  ${SOCIETE.telephone}`),
      h(Text, { style: s.footerText }, `${SOCIETE.details}`))));
}

export async function generateFactureVente(data: FactureVenteData): Promise<Blob> {
  return await pdf(React.createElement(Doc, { data }) as React.ReactElement<never>).toBlob();
}
