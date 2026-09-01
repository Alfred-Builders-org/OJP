export interface Parametres {
  id: number;
  prix_or: number;
  prix_argent: number;
  prix_platine: number;
  coefficient_rachat: number;
  coefficient_vente: number;
  /**
   * Tarifs au gramme des matieres qui ne suivent aucun cours : la boutique les
   * fixe, rien ne les releve.
   */
  prix_plaque_or: number;
  prix_plaque_argent: number;
  prix_autre: number;
  updated_at: string;
  /** Date du dernier relevé des cours (automatique ou forcé). */
  cours_maj_le: string | null;
}
