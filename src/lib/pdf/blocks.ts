// ============================================================
// PDF Design System — shared types and constants
// ============================================================

// Colors
export const GOLD = "#C8A84E";
export const DARK = "#2D2D2D";
export const GRAY = "#6B7280";
export const LIGHT_GRAY = "#E5E7EB";
export const WHITE = "#FFFFFF";

// Company info — mutable, refreshed from settings before PDF generation
export const SOCIETE = {
  nom: "L'Or au Juste Prix",
  /** Denomination sociale, distincte du nom commercial. */
  denominationSociale: "SAS ORJP",
  adresse: "4 Grande Rue 74160 St Julien en Genevois",
  telephone: "06 78 87 75 78",
  /** Ligne fixe de la boutique. */
  telephoneFixe: "04 50 35 62 06",
  email: "oraujusteprix@gmail.com",
  details: "SAS au capital de 5 000,00 \u20AC",
  siret_rcs: "928 126 390 R.C.S. Thonon-les-Bains",
  tva: "FR02 928 126 390",
};

import { getSettingServer } from "@/lib/settings-server";

/**
 * Refresh SOCIETE from settings. Call once before generating a PDF batch.
 * All PDF templates reference the same SOCIETE object, so mutating it in-place
 * means every template automatically picks up the latest values.
 */
export async function refreshSociete(): Promise<void> {
  const company = await getSettingServer("company");
  if (!company) return;
  SOCIETE.nom = company.nom || SOCIETE.nom;
  SOCIETE.denominationSociale = company.denomination_sociale || SOCIETE.denominationSociale;
  SOCIETE.adresse = [company.adresse, company.code_postal, company.ville].filter(Boolean).join(" ") || SOCIETE.adresse;
  SOCIETE.telephone = company.telephone || SOCIETE.telephone;
  SOCIETE.telephoneFixe = company.telephone_fixe || SOCIETE.telephoneFixe;
  SOCIETE.email = company.email || SOCIETE.email;
  SOCIETE.details = company.forme_juridique || SOCIETE.details;
  SOCIETE.siret_rcs = company.siret_rcs || SOCIETE.siret_rcs;
  SOCIETE.tva = company.tva_intracom || SOCIETE.tva;
}

// Types
export interface DocumentInfo {
  title: string;
  numero: string;
}

export interface ClientInfo {
  civilite: string;
  nom: string;
  prenom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  /** Coordonnées rappelées en tête de l'annexe du contrat de dépôt-vente. */
  telephone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface DossierInfo {
  numeroDossier: string;
  numeroLot: string;
  date: string;
  heure: string;
  reglement?: string;
}

export interface ReferenceLigne {
  designation: string;
  /**
   * Reference de l'article, « numero du lot / rang ». Affichee sous la
   * designation : c'est elle qui relie une ligne de document a l'objet en rayon
   * et a son inscription au registre.
   */
  reference?: string | null;
  metal: string;
  titrage: string;
  poids: number;
  quantite: number;
  taxe: string;
  prixUnitaire: number;
  prixTotal: number;
}

export interface TotauxInfo {
  totalBrut: number;
  taxe: number;
  netAPayer: number;
  taxeLabel?: string;
}

// Helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })
    .format(amount)
    // Replace narrow no-break space (U+202F) and non-breaking space (U+00A0) with regular space
    // so the PDF renderer displays them correctly
    .replace(/[\u202F\u00A0]/g, " ");
}

/**
 * Récapitulatif des poids par couple métal + titrage.
 *
 * Demandé en recette (parcours 7, étape 11) : « à côté du total, pour tous les
 * documents où on lit des références, l'agrégation des poids pour chaque
 * combinaison métal-titrage ». C'est ce que la fonderie et le comptable lisent
 * en premier — un contrat de dix lignes ne dit rien de la matière qu'il engage
 * tant que ces totaux ne sont pas faits à la main.
 *
 * La fonction était écrite trois fois, à l'identique, dans trois templates.
 */
export function recapitulatifTitrage(
  lignes: readonly {
    metal?: string;
    titrage?: string;
    poids?: number;
    quantite?: number;
  }[]
): string {
  const groupes: Record<string, number> = {};
  for (const ligne of lignes) {
    if (!ligne.poids || !ligne.metal) continue;
    const titrage = ligne.titrage && ligne.titrage !== "—" ? ligne.titrage : "";
    const cle = titrage ? `${ligne.metal} ${titrage}` : ligne.metal;
    groupes[cle] = (groupes[cle] ?? 0) + ligne.poids * (ligne.quantite ?? 1);
  }

  return Object.entries(groupes)
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([cle, poids]) => `${cle}: ${poids.toFixed(1)}g`)
    .join("   ·   ");
}

// Depot-vente specific types
export interface DepotVenteReferenceLigne {
  designation: string;
  reference?: string | null;
  description: string;
  /** Poids net, affiché sur le contrat et agrégé dans le récapitulatif. */
  poids?: number;
  quantite?: number;
  metal?: string;
  titrage?: string;
  prixNetDeposant: number;
  prixAffichePublic: number;
}

export interface ConfieReferenceLigne {
  titre: string;
  designation: string;
  reference?: string | null;
  quantite: number;
  poids: number;
  prixAchat: number;
  prixVente: number;
}

// CDV contract clauses
/**
 * Corps du contrat de dépôt-vente.
 *
 * Reprise intégrale de la rédaction fournie par la boutique (« DV renault
 * 17 03 26 »), là où les clauses précédentes n'en étaient qu'un résumé — ce qui
 * exposait la société à voir opposer un texte plus court que celui qu'elle
 * entend appliquer.
 *
 * Les mentions d'identité des parties, la date et les signatures ne figurent pas
 * ici : le gabarit les compose à partir du dossier. L'annexe 1 (fiche de dépôt)
 * est la page 2, générée depuis les références du lot.
 */
export function cdvClauses(
  commissionPct: number
): Array<{ title: string; body: string }> {
  // Le taux affiche doit etre celui reellement applique au lot : il etait ecrit
  // en dur a 40 %, si bien qu'un depot negocie a un autre taux produisait un
  // contrat qui annoncait le mauvais chiffre.
  const commission = Number.isFinite(commissionPct) ? commissionPct : 40;
  const commissionTexte = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(commission);

  return [
  {
    title: "OBJET DU CONTRAT",
    body: "Le présent contrat est établi à l'occasion du dépôt de marchandises appartenant au déposant-vendeur dans le local commercial du dépositaire. À charge pour ce dernier de les vendre en son nom et pour son compte contre une rémunération de ses services d'intermédiaire.\n\nSi le déposant-vendeur devait déposer de nouveaux objets, ces derniers feraient alors l'objet d'un nouveau contrat.",
  },
  {
    title: "DESCRIPTION DES MARCHANDISES",
    body: "Les marchandises faisant l'objet du contrat sont détaillées dans la fiche de dépôt ci-jointe.",
  },
  {
    title: "DURÉE DU CONTRAT",
    body: "Le présent contrat est conclu pour la durée de 1 (un) an à compter de la date de signature. Il peut être résilié à tout moment, par l'une ou l'autre des parties, à charge pour la partie qui prendra l'initiative de la rupture de la notifier par lettre recommandée avec AR avec préavis de 7 jours calendaires.\n\nEn cas de résiliation à l'initiative du déposant-vendeur, ce dernier s'engage à retirer ses biens dans un délai de 15 jours à compter de la réception de la notification. Une indemnité forfaitaire de 10 % du prix de vente public TTC sera alors due par le déposant-vendeur pour couvrir les frais engagés par le dépositaire.\n\nEn cas de résiliation à l'initiative du dépositaire, aucune indemnité ne sera due sauf en cas de manquement contractuel du déposant.",
  },
  {
    title: "PRIX DE VENTE",
    body: "Le prix de vente des articles au client final est fixé d'un commun accord entre dépositaire-vendeur et propriétaire-déposant. Il est mentionné pour chaque article sur la fiche de dépôt annexée au présent contrat.\n\nLe prix de vente est entendu TTC.",
  },
  {
    title: "CONDITIONS DE VENTE",
    body: "Le dépositaire se réserve le droit de refuser des articles en dépôt sans avoir à se justifier. Dans ce cas, les objets sont immédiatement rendus à leur propriétaire.\n\nLe dépositaire s'engage à exposer les objets confiés dans ses vitrines et, lorsqu'il en sera pourvu, il les publiera sur son site internet et les réseaux sociaux.\n\nLe cas échéant, le dépositaire s'engage à se conformer aux termes de la loi 2004-575 sur la confiance dans l'économie numérique. En conséquence, le dépositaire est susceptible de modifier les conditions de vente à tout moment pour se conformer à cette loi.\n\nEn cas de vente à distance, le dépositaire se charge de l'expédition, des emballages et des assurances. Les frais inhérents à l'expédition sont supportés par l'acquéreur.\n\nLa SAS L'Or au Juste Prix agit en qualité d'intermédiaire entre le dépositaire-vendeur et le client final. Le dépositaire-vendeur assume seul la responsabilité de la qualité et de la provenance des objets qu'il a confiés au dépositaire.\n\nLes conditions de vente de la SAS L'Or au Juste Prix constituent un contrat entre elle-même et les clients dépositaires-vendeurs. Le fait d'accepter les services du dépositaire constitue une acceptation totale et entière des conditions de vente.",
  },
  {
    title: "RÉPARATIONS ET NETTOYAGE",
    body: "Si les objets déposés ne sont pas propres, et que le déposant-vendeur souhaite tout de même les vendre, le dépositaire devra alors procéder au nettoyage. Il sera alors facturé la somme de 20 euros TTC pour chaque objet confié en dépôt qui devra subir un nettoyage.\n\nSi des réparations sont à prévoir avant la mise en dépôt, L'Or au Juste Prix peut s'en charger, mais le prix des réparations sera retiré du prix final remis au dépositaire.\n\nSi le bijou n'a pas pu être vendu, les frais de réparation seront alors facturés au franc le franc au propriétaire-déposant. Les objets ne seront restitués qu'après remboursement des frais réels avancés par le dépositaire.",
  },
  {
    title: "INVENDUS",
    body: "Les objets invendus à l'issue du contrat seront restitués en l'état au déposant-vendeur. Le dépositaire décline toute responsabilité quant à l'altération des objets pendant leur exposition dans les vitrines.",
  },
  {
    title: "RÉMUNÉRATION DU DÉPOSITAIRE",
    body: `Le dépositaire sera rémunéré pour le service qu'il propose par une commission sur le prix de vente. La commission s'élève à ${commissionTexte} % du prix de vente public.\n\nLe prix souhaité par le propriétaire-déposant, la rémunération du dépositaire ainsi que les modalités des soldes et promotions sont consignées sur la feuille de dépôt.`,
  },
  {
    title: "SOLDES ET PROMOTIONS",
    body: "Le dépositaire se réserve le droit de réaliser des soldes ou des promotions sur les articles déposés, en accord avec le déposant-vendeur. Les modalités de ces soldes ou promotions (pourcentage de réduction, période de validité) seront définies en accord avec le déposant-vendeur et consignées sur la fiche de dépôt.\n\nLe dépositaire n'a pas à prévenir le déposant-vendeur des éventuels soldes et promotions mis en place.\n\nÀ titre indicatif — Soldes : réduction de 20 % à 50 % sur le prix de vente initial pendant 2 à 4 semaines (janvier/février et juin/juillet). Promotions : réduction de 10 % à 30 % sur le prix de vente initial selon les périodes et thématiques (saison, fête des mères, Saint-Valentin, etc.).",
  },
  {
    title: "ASSURANCES",
    body: "En cas d'incident sur un objet mis en dépôt tel que vol, casse ou incendie, le dépositaire s'engage à rembourser le déposant-vendeur du montant indiqué sur la fiche de dépôt à la mention « prix de vente demandé ». Charge au dépositaire, ensuite, de se retourner contre son assurance.",
  },
  {
    title: "PAIEMENT DES OBJETS VENDUS",
    body: "Le dépositaire s'engage à régler les pièces vendues sous un délai de 15 jours. Les paiements sont effectués par chèque ou par virement et accompagnés de la quittance correspondante.",
  },
  {
    title: "OBLIGATIONS DU DÉPOSANT-VENDEUR",
    body: "Le déposant-vendeur s'engage à : remettre au dépositaire les objets en bon état ; fournir dans la mesure du possible la facture d'achat et le certificat d'authenticité lors du dépôt ; fixer le prix de vente des marchandises déposées en accord avec le dépositaire ; récupérer les marchandises déposées non vendues à l'expiration du contrat.\n\nLe déposant donne mandat exclusif au dépositaire SAS ORJP de vendre pour son compte les articles énumérés dans la fiche de dépôt annexée, et l'autorise à prélever sur le prix de cession desdits articles la commission au taux convenu exprimé dans la feuille de dépôt, ainsi que les frais inhérents aux travaux réalisés pour mettre les objets en valeur et, s'il y a lieu, les frais de dédit.\n\nLe déposant-vendeur autorise la SAS L'Or au Juste Prix à faire des photos de ses objets afin de les publier sur le site de la société et, le cas échéant, sur les réseaux sociaux. S'il y a lieu, les frais d'expédition seront supportés par l'acquéreur de l'objet.",
  },
  {
    title: "RESTITUTION DES OBJETS",
    body: "À l'issue du contrat, et si les objets ne sont pas vendus, le dépositaire en informe le déposant-vendeur. Ce dernier dispose d'un délai de 15 jours pour récupérer lesdits objets.\n\nEn l'absence de réaction du déposant-vendeur, le dépositaire devra, à l'issue de ces 15 jours, envoyer une lettre recommandée avec AR au déposant-vendeur pour lui signifier la mise à disposition du ou des objets non vendus. Le courrier devra rappeler que les objets deviendront la propriété de L'Or au Juste Prix à l'issue d'un an et un jour après la fin du contrat s'ils n'ont pas été récupérés entre-temps.\n\nÀ l'issue de ce délai d'un an et un jour, et si le déposant-vendeur n'est pas venu récupérer les objets, la SAS L'Or au Juste Prix pourra alors : les céder à titre gratuit ou onéreux ; ou les détruire ; ou les conserver (10 € TTC par mois entamé à la charge du déposant).\n\nL'entreprise ne pourra en aucun cas être tenue responsable à quelque titre que ce soit, et aucune réclamation ultérieure ne pourra être prise en compte une fois le délai passé.",
  },
  {
    title: "LITIGES",
    body: "La responsabilité de L'Or au Juste Prix ne saurait répondre ni de la qualité, ni de la provenance, ni de l'état de fonctionnement des objets confiés par le déposant-vendeur, qui en est le seul responsable. La SAS L'Or au Juste Prix ne contractant pas d'obligations au déposant au-delà d'un délai de 15 jours à compter de la vente, aucune réclamation ne sera possible passé ce délai.\n\nSi un litige quelconque venait ultérieurement faire annuler la vente par la SAS L'Or au Juste Prix, la commission versée à cette occasion restera acquise de plein droit en rémunération de l'exécution du mandat.\n\nEn cas de litige, les parties s'engagent à rechercher une solution amiable. Si aucun accord n'est trouvé dans un délai de 30 jours, elles conviennent de recourir à une médiation avant toute action en justice. Le médiateur sera choisi d'un commun accord ou, à défaut, désigné par un centre de médiation compétent. Les frais de médiation seront partagés entre les parties. À défaut de résolution du litige par médiation, chaque partie retrouvera sa liberté d'agir en justice.\n\nLe Tribunal de Thonon-les-Bains sera seul compétent en cas de litige. Ce contrat est soumis au droit français.",
  },
  {
    title: "ACCEPTATION",
    body: "En signant le présent document et les 2 annexes, le déposant-vendeur déclare avoir pris connaissance et accepter les termes et conditions du présent contrat. Il reconnaît notamment être le seul propriétaire des objets désignés et donner mandat au dépôt-vente de les vendre. Il déclare également avoir pris connaissance de toutes les conditions de ce dépôt-vente, en particulier celles relatives à la baisse des prix.\n\nPièces jointes : carte d'identité ou passeport, RIB, certificats d'authenticité et factures.",
    },
  ];
}

// Legal texts
export const TEXTE_CONDITIONS_CONFIE =
  "Le vendeur déclare avoir atteint la majorité légale, être le propriétaire légitime des biens, agir à titre privé et que ces biens ne proviennent d'aucune activité illicite. La taxe sur les métaux précieux est acquittée par nos soins.";

export const TEXTE_CONDITIONS_ACHAT_TMP =
  "Le vendeur déclare avoir atteint la majorité légale, être le propriétaire légitime des biens, agir à titre privé et que ces biens ne proviennent d'aucune activité illicite. La taxe sur les métaux précieux (11,5%) est acquittée par nos soins.";

export const TEXTE_CONDITIONS_ACHAT_TFOP =
  "Le vendeur déclare avoir atteint la majorité légale, être le propriétaire légitime des biens, agir à titre privé et que ces biens ne proviennent d'aucune activité illicite. La taxe forfaitaire sur les objets précieux (6,5%) est acquittée par nos soins si le montant de cession dépasse 5 000 €.";

export const TEXTE_CONDITIONS_ACHAT = TEXTE_CONDITIONS_ACHAT_TMP;

export const TEXTE_CONDITIONS_CONTRAT =
  `Si vous souhaitez exercer votre droit de rétractation dans les 48 heures à compter de la signature du contrat vous pouvez utiliser le formulaire détachable prévu à cet effet ou toute autre déclaration dénuée d'ambigüité exprimant votre volonté de vous rétracter conformément à l'article R224-4.

Conformément à l'article R.224-7, pour exercer son droit de rétractation prévu par l'article L.224-99, le consommateur-vendeur, sans avoir à justifier de motifs, remet au professionnel en main propre le formulaire détachable ou toute autre déclaration dénuée d'ambiguïté exprimant sa volonté de se rétracter, au plus tard 48H à compter du jour et de l'heure de la signature du contrat, ou toute autre moyen permettant d'attester de la date et l'heure d'envoi au plus tard 48h à compter du jour et de l'heure de la signature du contrat. Si le délai expire un samedi, un dimanche, un jour chômé ou un jour férié, il est prorogé jusqu'au premier jour ouvrable suivant à la même heure. L'envoi ou la remise du formulaire au professionnel et dans le délai imparti a pour effet d'annuler l'opération d'achat. A défaut le contrat est conclu définitivement.

Rappel : Conformément au 2eme alinéa de l'article L.224-9, l'exercice du droit de rétractation met fin aux obligations des parties. Le consommateur doit alors rembourser au professionnel le prix perçu, et, en contrepartie, ce dernier doit lui restituer le ou les objets achetés. A défaut de restituer le ou les objets achetés, le professionnel verse au consommateur une somme équivalente au double prix de vente perçu pour le bien ou les objets achetés. Conformément au troisième alinéa du même article, le consommateur-vendeur ne dispose pas d'un droit de rétractation pour les opérations d'or d'investissement.`;

export const TEXTE_DEVIS_VALIDITE =
  "Ce devis est valable 48 heures à compter de sa date d'émission. Passé ce délai, les prix pourront être révisés en fonction du cours des métaux précieux. Les prix indiqués sont basés sur les cours en vigueur au moment de l'établissement du devis.";

// Quittance dépôt-vente types
export interface QuittanceDepotVenteLigne {
  reference?: string | null;
  designation: string;
  description: string;
  prixVentePublic: number;
  netDeposant: number;
  commission: number;
}

// Facture de vente types
export interface FactureVenteLigne {
  reference?: string | null;
  titre: string;
  designation: string;
  poids: number;
  quantite: number;
  prixUnitaireHT: number;
  totalHT: number;
  /**
   * Article vendu sous le regime des biens d'occasion. Son prix ne se ventile
   * pas : le montant affiche est celui paye, taxe comprise. Sur une facture qui
   * melange les deux regimes, ces lignes portent un renvoi vers la mention.
   */
  sousMarge?: boolean;
}

export const TEXTE_CONDITIONS_QUITTANCE_DV =
  "Ce document atteste du règlement des sommes dues au déposant-vendeur suite à la vente des articles ci-dessus, conformément au contrat de dépôt-vente en vigueur. La commission du dépositaire a été déduite du montant brut conformément aux conditions contractuelles.";

export const TEXTE_CGV_VENTE =
  "La TVA n'est pas applicable pour des achats ou vente d'or d'investissement.\n1) Exonération suivant l'article 298 sexdecies A du CGI. AUTOLIQUIDATION TVA\n2) Opération bénéficiant du régime de l'autoliquidation prévue à l'article 283-2 sexis du CGI.";

// Bon de commande fonderie types
// Sans prix : le bon dit ce qu'on commande, la fonderie repond par son devis.
export interface BonCommandeLigne {
  designation: string;
  metal: string;
  poids: number;
  quantite: number;
}

export interface FonderieInfo {
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

export const TEXTE_CONDITIONS_BON_COMMANDE =
  "Ce bon de commande est émis par L'Or au Juste Prix pour l'achat d'or d'investissement. Merci de confirmer la réception de cette commande par retour et par mail, accompagnée de votre devis chiffré aux cours en vigueur.";

// Bon de livraison fonderie types
export interface BonLivraisonLigneData {
  designation: string;
  metal: string;
  titrage: string;
  poids: number;
  cours: number;
  valeur: number;
}

export interface BonLivraisonGroupData {
  metal: string;
  titrage: string;
  lignes: BonLivraisonLigneData[];
  sousTotal: { pieces: number; poids: number; valeur: number };
}

export const TEXTE_CONDITIONS_BON_LIVRAISON =
  "Ce bon de livraison atteste de la remise des articles ci-dessus à la fonderie désignée pour traitement (fonte). Les poids et titrages indiqués sont ceux déclarés lors de l'expertise. La fonderie s'engage à communiquer les résultats de ses tests dans les meilleurs délais.";

export const TEXTE_CGV_ACOMPTE =
  "Facture d'acompte de 10% sur commande d'or d'investissement. Le solde de 90% est exigible sous 48 heures à compter de la date de la présente facture. À défaut de règlement dans ce délai, la commande sera automatiquement annulée et l'acompte restera acquis.\n\nLa TVA n'est pas applicable pour des achats ou vente d'or d'investissement.\n1) Exonération suivant l'article 298 sexdecies A du CGI. AUTOLIQUIDATION TVA\n2) Opération bénéficiant du régime de l'autoliquidation prévue à l'article 283-2 sexis du CGI.";
