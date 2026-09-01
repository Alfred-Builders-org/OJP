import { StyleSheet } from "@react-pdf/renderer";
import "./register-fonts";

export const C = {
  black: "#1A1A1A",
  text: "#333333",
  gray: "#777777",
  grayLight: "#AAAAAA",
  line: "#E0E0E0",
  gold: "#B8963E",
  white: "#FFFFFF",
};

/**
 * Police des documents : Geist, une sans serif, en lieu et place de Courier.
 * Les variantes se demandent par `fontWeight: 700` et `fontStyle: "italic"` —
 * voir `register-fonts.ts` pour la famille enregistree.
 */
export const FONT = "Geist";

export const styles = StyleSheet.create({
  // paddingBottom laisse la place aux trois lignes de mentions du pied de page.
  page: { fontFamily: FONT, fontSize: 8, color: C.text, backgroundColor: C.white, paddingTop: 28, paddingBottom: 50, paddingHorizontal: 45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  logo: { width: 110, height: 48 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 9, fontWeight: 700, color: "#1A1A1A", marginBottom: 5 },
  companyLine: { fontSize: 7, color: "#777777", textAlign: "right" },
  infoSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  clientBlock: { maxWidth: 230 },
  label: { fontSize: 7, fontWeight: 700, color: "#1A1A1A", marginBottom: 5 },
  clientName: { fontSize: 10, fontWeight: 700, color: "#1A1A1A", marginBottom: 1 },
  clientLine: { fontSize: 8, color: "#777777", marginBottom: 1 },
  clientMuted: { fontSize: 7, color: "#AAAAAA", marginTop: 3 },
  docRight: { alignItems: "flex-end", maxWidth: 250 },
  docTitle: { fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 },
  infoLabel: { fontSize: 6.5, fontWeight: 700, color: "#777777", marginBottom: 2, textAlign: "right" },
  infoValue: { fontSize: 8, color: "#333333", textAlign: "right", marginBottom: 8 },
  // En-tete : le document se nomme a gauche, l'identite du client se lit a
  // droite, a l'aplomb de la fenetre d'une enveloppe. Les reperes du document
  // (numero, date, contrat annule) se rangent en ligne sous le titre : ils se
  // lisent d'un coup d'oeil et coutent une ligne au lieu de quatre.
  docLeft: { maxWidth: 300 },
  docTitleLeft: { fontSize: 19, fontWeight: 700, color: "#1A1A1A", marginBottom: 7 },
  reperes: { flexDirection: "row", gap: 24 },
  repereLabel: { fontSize: 6.5, fontWeight: 700, color: "#777777", letterSpacing: 0.4, marginBottom: 2 },
  repereValue: { fontSize: 11, fontWeight: 700, color: "#1A1A1A" },
  tableWrap: { marginBottom: 6 },
  tableHead: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A", paddingBottom: 5 },
  th: { fontSize: 6, fontWeight: 700, color: "#1A1A1A" },
  tableRow: { flexDirection: "row", paddingVertical: 4.5, borderBottomWidth: 0.3, borderBottomColor: "#E0E0E0" },
  td: { fontSize: 8, color: "#777777" },
  tdBold: { fontSize: 8, color: "#1A1A1A" },
  bottom: { flexDirection: "row", marginTop: 8 },
  bottomLeft: { flex: 1, paddingRight: 20 },
  bottomRight: { width: 200 },
  totGoldLine: { borderBottomWidth: 1, borderBottomColor: "#B8963E", marginBottom: 10 },
  totRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totLabel: { fontSize: 8, color: "#777777" },
  totValue: { fontSize: 8, color: "#333333" },
  totSep: { borderBottomWidth: 0.3, borderBottomColor: "#E0E0E0", marginVertical: 4 },
  netRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  netLabel: { fontSize: 12, fontWeight: 700, color: "#1A1A1A" },
  netValue: { fontSize: 12, fontWeight: 700, color: "#1A1A1A" },
  sectionLabel: { fontSize: 7, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 },
  recapText: { fontSize: 7, color: "#777777", marginBottom: 12 },
  // Mentions legales en pied de document : c'est le texte que le client oppose a
  // la societe en cas de litige, il doit se lire sans loupe.
  condText: { fontSize: 8, color: "#777777", lineHeight: 1.45 },
  sigBlock: { marginTop: 10, alignItems: "flex-end" },
  sigLabel: { fontSize: 7, color: "#777777", fontStyle: "italic" },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#E0E0E0", width: 140, marginTop: 18 },
  // Pied de page : les mentions legales de l'article R.123-238 s'y empilent sur
  // trois lignes centrees — coordonnees, puis identite de la societe.
  footer: { position: "absolute", bottom: 12, left: 45, right: 45, borderTopWidth: 0.5, borderTopColor: "#B8963E", paddingTop: 5, alignItems: "center" },
  footerText: { fontSize: 6.5, color: "#888888", textAlign: "center" },
  footerLegal: { fontSize: 6.5, color: "#888888", textAlign: "center", marginTop: 1 },
  // Conditions generales du contrat de rachat. Plus grosses, plus foncees et
  // plus serrees : c'est ce qui libere la hauteur necessaire pour ramener le
  // bordereau de retractation sur la meme page que le contrat.
  condBlock: { marginTop: 8 },
  condTitle: { fontSize: 9, fontWeight: 700, color: "#1A1A1A", marginBottom: 5 },
  condBody: { fontSize: 8, color: "#4A4A4A", lineHeight: 1.26 },
  // Bordereau
  bordereauCut: { borderBottomWidth: 1, borderBottomColor: "#777777", borderStyle: "dashed", marginTop: 14, marginBottom: 10 },
  bordereauTitle: { fontSize: 10, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 7 },
  bordereauIntro: { fontSize: 8, color: "#777777", marginBottom: 8, lineHeight: 1.4 },
  bordereauFieldRow: { flexDirection: "row", marginBottom: 5 },
  bordereauFieldLabel: { fontSize: 8.5, fontWeight: 700, color: "#1A1A1A", width: 88 },
  // flex: 1 pour que le nom du client reste dans sa demi-largeur au lieu de
  // deborder sur le champ voisin.
  bordereauFieldValue: { fontSize: 8.5, color: "#777777", flex: 1 },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },
  mb4: { marginBottom: 4 },
  mt8: { marginTop: 8 },
  // CDV-specific styles
  cdvTitle: { fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 },
  cdvNumero: { fontSize: 9, color: "#777777" },
  cdvTwoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 20 },
  cdvColLeft: { flex: 1, borderWidth: 0.5, borderColor: "#E0E0E0", padding: 10, borderRadius: 2 },
  cdvColRight: { flex: 1, borderWidth: 0.5, borderColor: "#E0E0E0", padding: 10, borderRadius: 2 },
  cdvColLabel: { fontSize: 6.5, fontWeight: 700, color: "#B8963E", marginBottom: 4, letterSpacing: 0.5 },
  cdvColName: { fontSize: 9, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 },
  cdvColLine: { fontSize: 7.5, color: "#777777", marginBottom: 1 },
  // Clauses du contrat de depot-vente : c'est le corps du contrat, pas une note
  // de bas de page. Il se lisait a 5,5 points.
  cdvClauseTitle: { fontSize: 8.5, fontWeight: 700, color: "#1A1A1A", marginBottom: 3, marginTop: 9 },
  cdvClauseBody: { fontSize: 8, color: "#777777", lineHeight: 1.45 },
  cdvSignatureSection: { marginTop: 16, alignItems: "center" },
  cdvSignatureTitle: { fontSize: 8, fontWeight: 700, color: "#B8963E", textAlign: "center", marginBottom: 6 },
  cdvSignatureDate: { fontSize: 8, color: "#777777", textAlign: "center", marginBottom: 16 },
  cdvSignatureRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  cdvSignatureZone: { width: "40%" },
  cdvSignatureLabel: { fontSize: 8, fontWeight: 700, color: "#1A1A1A", marginBottom: 20 },
  // FVE-specific styles (facture de vente)
  fveTitle: { fontSize: 18, fontWeight: 700, color: "#B8963E" },
  fveNumero: { fontSize: 9, color: "#777777", marginTop: 2 },
  fveClientBox: { borderLeftWidth: 2, borderLeftColor: "#B8963E", paddingLeft: 12, paddingVertical: 8, marginBottom: 20 },
  fveClientLabel: { fontSize: 6.5, fontWeight: 700, color: "#777777", marginBottom: 3, letterSpacing: 0.5 },
  fveClientName: { fontSize: 10, fontWeight: 700, color: "#1A1A1A", marginBottom: 1 },
  fveClientLine: { fontSize: 8, color: "#777777", marginBottom: 1 },
  fveClientMuted: { fontSize: 7, color: "#AAAAAA", marginTop: 1 },
  fveDateRow: { textAlign: "right" as const, fontSize: 8, color: "#333333", marginBottom: 2 },
  fveDateLeft: { fontSize: 8.5, color: "#333333", marginBottom: 3 },
  fveCgvTitle: { fontSize: 9, fontWeight: 700, color: "#B8963E", marginBottom: 4 },
  fveCgvText: { fontSize: 8, color: "#777777", lineHeight: 1.45 },
  fveCutLine: { borderBottomWidth: 1, borderBottomColor: "#777777", borderStyle: "dashed" as const, marginVertical: 20 },
  fveSigLabel: { fontSize: 8, color: "#777777", textAlign: "center" as const, marginTop: 10, fontStyle: "italic" },
  // QDV-specific styles (quittance dépôt-vente)
  qdvRefText: { fontSize: 7, color: "#AAAAAA", marginTop: 3 },
  // Reference de l'article, sous sa designation : assez lisible pour etre
  // recopiee, assez discrete pour ne pas concurrencer le libelle.
  refLigne: { fontSize: 5.5, color: "#999999", marginTop: 1 },
});

export const W = {
  des: "26%", met: "9%", tit: "8%", poi: "8%", qte: "6%", tax: "9%", pu: "16%", pt: "18%",
};

// CDV column widths (page 2 table)
export const W_CDV = {
  des: "23%", desc: "27%", poids: "12%", prixNet: "19%", prixPublic: "19%",
};

// CONF column widths
export const W_CONF = {
  titre: "12%", des: "28%", qte: "10%", poids: "12%", prixAchat: "18%", prixVente: "20%",
};

// QDV column widths (quittance dépôt-vente)
export const W_QDV = {
  des: "28%", desc: "24%", prixVente: "16%", commission: "16%", netDeposant: "16%",
};

// FVE column widths (facture de vente)
export const W_FVE = {
  titre: "12%", des: "34%", poids: "12%", qte: "8%", puHT: "16%", totalHT: "18%",
};

// BDL column widths (bon de livraison)
export const W_BDL = {
  des: "34%", poids: "14%", cours: "18%", valeur: "18%",
};

export function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(n).replace(/[\u202F\u00A0]/g, " ");
}
