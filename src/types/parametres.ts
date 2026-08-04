export interface Parametres {
  id: number;
  prix_or: number;
  prix_argent: number;
  prix_platine: number;
  coefficient_rachat: number;
  coefficient_vente: number;
  updated_at: string;
  /** Date du dernier relevé des cours (automatique ou forcé). */
  cours_maj_le: string | null;
}
