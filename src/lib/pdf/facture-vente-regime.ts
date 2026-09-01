/**
 * Ce qu'une facture de vente montre depend du regime de ses lignes.
 *
 * Deux chemins produisent cette facture — la finalisation d'un dossier et la
 * regeneration a la demande. Ils doivent en donner la meme lecture, d'ou ce
 * calcul unique.
 */

/** Le minimum qu'une ligne doit porter pour qu'on sache la facturer. */
export interface LigneVenteTaxee {
  prix_total: number;
  montant_taxe: number;
  type_taxe: "tva_marge" | "tva_normale" | "tfop" | null;
  /**
   * L'or d'investissement est exonere de TVA : il ne releve d'aucun regime
   * particulier, et la mention du 297 A ne lui est pas due. Une vente sans
   * acompte le porte sur la meme facture que les bijoux, d'ou la distinction
   * ici.
   */
  or_investissement_id?: string | null;
}

export interface TotauxFactureVente {
  /** Ce que le client paie. */
  totalTTC: number;
  /** N'a de sens que si toute la facture se ventile. */
  totalHT: number;
  /** La seule TVA mentionnable : celle des articles hors regime de la marge. */
  tva: number;
  /**
   * Ce que la boutique reverse au Tresor : TVA sur la marge comprise. Elle
   * n'apparait jamais sur la facture du client — il ne la recupere pas — mais
   * elle est due, et le registre des impots s'en nourrit.
   */
  tvaDue: number;
  /** Toutes les lignes relevent de la marge : rien ne se ventile. */
  regimeMarge: boolean;
  /** Au moins une ligne en releve : la mention du 297 A est obligatoire. */
  mentionMarge: boolean;
}

/**
 * Une ligne releve du regime de la marge sauf si sa TVA porte sur le prix
 * entier. Les lignes sans taxe du tout — un bijou revendu a perte, une marge
 * nulle — en relevent aussi : la mention leur reste due.
 *
 * L'or d'investissement fait exception : il est exonere, pas taxe sur une
 * marge. Lui appliquer la mention du 297 A serait faux.
 */
export function ligneSousMarge(
  l: Pick<LigneVenteTaxee, "type_taxe" | "or_investissement_id">
): boolean {
  if (l.or_investissement_id) return false;
  return l.type_taxe !== "tva_normale";
}

export function totauxFactureVente(lignes: LigneVenteTaxee[]): TotauxFactureVente {
  const auCentime = (n: number) => Math.round(n * 100) / 100;

  // Le prix d'une ligne est celui de l'etiquette, taxe comprise. Seule la TFOP
  // des lignes anciennes s'ajoutait au prix : elle est due par le vendeur
  // particulier et n'a plus sa place sur la facture du client final.
  const totalTTC = auCentime(
    lignes.reduce(
      (s, l) => s + l.prix_total + (l.type_taxe === "tfop" ? l.montant_taxe : 0),
      0
    )
  );
  const tva = auCentime(
    lignes.reduce((s, l) => s + (l.type_taxe === "tva_normale" ? l.montant_taxe : 0), 0)
  );
  const tvaDue = auCentime(
    lignes.reduce(
      (s, l) =>
        s + (l.type_taxe === "tva_normale" || l.type_taxe === "tva_marge" ? l.montant_taxe : 0),
      0
    )
  );

  return {
    totalTTC,
    totalHT: auCentime(totalTTC - tva),
    tva,
    tvaDue,
    regimeMarge: lignes.length > 0 && lignes.every(ligneSousMarge),
    mentionMarge: lignes.some(ligneSousMarge),
  };
}
