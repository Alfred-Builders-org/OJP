import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles as s } from "./shared-styles";
import { SOCIETE, type ClientInfo, type DossierInfo } from "./blocks";

const h = React.createElement;

/**
 * Pied de page commun a tous les documents.
 *
 * Les gabarits en portaient chacun une version differente : deux lignes ici,
 * trois la, jamais les memes mentions. L'article R.123-238 du code de commerce
 * en exige un jeu precis sur tout document commercial — denomination, forme et
 * capital, RCS, TVA intracommunautaire — auxquels la boutique ajoute ses
 * coordonnees completes, fixe compris.
 *
 * @param complement ligne libre ajoutee en fin (le numero du document sur les
 *   bons destines a la fonderie).
 */
export function piedDePage(complement?: string) {
  return h(View, { style: s.footer, fixed: true },
    h(Text, { style: s.footerText },
      `${SOCIETE.nom}  ·  ${SOCIETE.adresse}`),
    h(Text, { style: s.footerText },
      `Tél. ${SOCIETE.telephoneFixe}  ·  ${SOCIETE.telephone}  ·  ${SOCIETE.email}`),
    h(Text, { style: s.footerLegal },
      `${SOCIETE.denominationSociale}  ·  ${SOCIETE.details}  ·  ${SOCIETE.siret_rcs}  ·  TVA ${SOCIETE.tva}`),
    complement ? h(Text, { style: s.footerLegal }, complement) : null);
}

/** Un repere du document : son intitule au-dessus de sa valeur. */
export interface Repere {
  label: string;
  value: string;
}

/**
 * Colonne de gauche de l'en-tete : le nom du document, puis ses reperes ranges
 * en ligne. Numero et date se lisent cote a cote plutot qu'empiles.
 */
export function blocDocument(titre: string, reperes: Repere[]) {
  return h(View, { style: s.docLeft },
    h(Text, { style: s.docTitleLeft }, titre),
    h(View, { style: s.reperes },
      ...reperes.map((r, i) =>
        h(View, { key: i },
          h(Text, { style: s.repereLabel }, r.label),
          h(Text, { style: s.repereValue }, r.value)))));
}

/**
 * Colonne de droite de l'en-tete : l'identite et l'adresse de la personne a qui
 * le document s'adresse. A droite parce que c'est la que la fenetre d'une
 * enveloppe la cherche.
 */
export function blocIdentite(
  client: ClientInfo,
  dossier: DossierInfo,
  label = "CLIENT"
) {
  const nomComplet = `${client.civilite} ${client.prenom} ${client.nom}`;
  const ville = [client.codePostal, client.ville].filter(Boolean).join(" ");

  return h(View, { style: s.clientBlock },
    h(Text, { style: s.label }, label),
    h(Text, { style: s.clientName }, nomComplet),
    client.adresse ? h(Text, { style: s.clientLine }, client.adresse) : null,
    ville ? h(Text, { style: s.clientLine }, ville) : null,
    client.documentType && client.documentNumber
      ? h(Text, { style: s.clientMuted }, `${client.documentType} : ${client.documentNumber}`)
      : null,
    h(Text, { style: s.clientMuted }, `Dossier : ${dossier.numeroDossier}`));
}

/**
 * Variante « facture » du bloc d'identite : encadre du filet dore, largeur fixe
 * pour tenir dans la colonne de droite a cote des dates.
 */
export function blocIdentiteFacture(
  client: ClientInfo,
  dossier: DossierInfo,
  label = "CLIENT"
) {
  const nomComplet = `${client.civilite} ${client.prenom} ${client.nom}`;
  const ville = [client.codePostal, client.ville].filter(Boolean).join(" ");

  return h(View, { style: [s.fveClientBox, { width: 235, marginBottom: 0 }] },
    h(Text, { style: s.fveClientLabel }, label),
    h(Text, { style: s.fveClientName }, nomComplet),
    client.adresse ? h(Text, { style: s.fveClientLine }, client.adresse) : null,
    ville ? h(Text, { style: s.fveClientLine }, ville) : null,
    client.documentType && client.documentNumber
      ? h(Text, { style: s.fveClientMuted }, `${client.documentType} : ${client.documentNumber}`)
      : null,
    h(Text, { style: s.fveClientMuted }, `Dossier : ${dossier.numeroDossier}`));
}

/**
 * En-tete complet : le document a gauche, celui qui le recoit a droite.
 */
export function enTeteDocument(
  titre: string,
  reperes: Repere[],
  client: ClientInfo,
  dossier: DossierInfo,
  labelIdentite = "CLIENT"
) {
  return h(View, { style: s.infoSection },
    blocDocument(titre, reperes),
    blocIdentite(client, dossier, labelIdentite));
}
