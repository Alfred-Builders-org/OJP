import { z } from "zod";

// ============================================================
// Lot status options
// ============================================================
export const LOT_STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_cours", label: "En cours" },
  { value: "finalise", label: "Finalisé" },
] as const;

export const LOT_TYPE_OPTIONS = [
  { value: "rachat", label: "Rachat" },
  { value: "vente", label: "Vente" },
  { value: "depot_vente", label: "Dépôt-vente" },
] as const;

export const REFERENCE_CATEGORIE_OPTIONS = [
  { value: "bijoux", label: "Bijoux" },
  { value: "or_investissement", label: "Or Investissement" },
] as const;

/**
 * Les metaux precieux, dont le cours du jour pilote le prix.
 */
export const METAL_COURS_OPTIONS = [
  { value: "Or", label: "Or" },
  { value: "Argent", label: "Argent" },
  { value: "Platine", label: "Platine" },
] as const;

/**
 * Les matieres a tarif fixe.
 *
 * Le plaque et les matieres non precieuses ne suivent aucun marche : la boutique
 * fixe un tarif au gramme, saisi dans les parametres. Leur titrage n'a pas de
 * sens — c'est une couche de metal precieux sur un support qui n'en est pas —
 * et le prix ne depend donc que du poids.
 */
export const METAL_PLAQUE_OPTIONS = [
  { value: "Plaque or", label: "Plaqué or" },
  { value: "Plaque argent", label: "Plaqué argent" },
] as const;

/** Ce qui n'est fait d'aucun metal precieux : fantaisie, acier, cuir. */
export const METAL_AUTRE_OPTIONS = [
  { value: "Autre", label: "Autre (non précieux)" },
] as const;

export const METAL_PRIX_FIXE_OPTIONS = [
  ...METAL_PLAQUE_OPTIONS,
  ...METAL_AUTRE_OPTIONS,
] as const;

/**
 * Les trois familles, dans l'ordre d'affichage. Le selecteur les separe : un
 * metal au cours, un plaque et une matiere non precieuse ne se valorisent pas de
 * la meme facon, et les confondre dans une liste plate invite a l'erreur.
 */
export const METAL_GROUPES = [
  METAL_COURS_OPTIONS,
  METAL_PLAQUE_OPTIONS,
  METAL_AUTRE_OPTIONS,
] as const;

/** Matieres dont le titrage n'a pas a etre saisi. */
export const METAUX_SANS_TITRAGE: readonly string[] =
  METAL_PRIX_FIXE_OPTIONS.map((m) => m.value);

export function estMetalPrixFixe(metal: string | null | undefined): boolean {
  return !!metal && METAUX_SANS_TITRAGE.includes(metal);
}

/**
 * Toutes les matieres qu'on peut racheter, mettre en stock ou prendre en
 * depot-vente.
 */
export const METAL_OPTIONS = [
  ...METAL_COURS_OPTIONS,
  ...METAL_PRIX_FIXE_OPTIONS,
] as const;

/**
 * Conserve pour les appels existants : le stock accepte desormais exactement les
 * memes matieres que le rachat.
 */
export const METAL_STOCK_OPTIONS = METAL_OPTIONS;

/**
 * Titrages courants, proposes en repere sous le champ de saisie.
 *
 * La liste fermee laissait de cote des titrages reellement rencontres — 800 et
 * 925 pour l'argent, 950 pour le platine : le titrage se saisit maintenant
 * librement, en milliemes, entre 0 et 1000.
 */
export const TITRAGES_COURANTS = [333, 375, 585, 750, 800, 900, 925, 950, 999] as const;

export const TITRAGE_MIN = 0;
export const TITRAGE_MAX = 1000;

/** Conserve pour les selecteurs qui n'ont pas encore migre. */
export const QUALITE_OPTIONS = TITRAGES_COURANTS.map((t) => ({
  value: String(t),
  label: String(t),
}));

/**
 * Le depot-vente n'est pas une destination de reference : il suppose un lot de
 * depot-vente a part entiere, avec son contrat et son deposant. Une reference de
 * rachat part donc en stock ou en fonderie, rien d'autre.
 *
 * « Non defini » est une valeur a part entiere : sans elle, le premier choix
 * etait definitif, le selecteur ignorant la valeur vide.
 */
export const DESTINATION_NON_DEFINIE = "non_definie";

export const DESTINATION_OPTIONS = [
  { value: DESTINATION_NON_DEFINIE, label: "Non définie" },
  { value: "stock_boutique", label: "Stock boutique" },
  { value: "fonderie", label: "Fonderie" },
] as const;

// ============================================================
// Bijoux reference form schema
// ============================================================
export const referenceBijouxSchema = z.object({
  designation: z.string().min(1, "La désignation est requise").max(200),
  metal: z.enum(["Or", "Argent", "Platine"], {
    message: "Le métal est requis",
  }),
  qualite: z.enum(["333", "375", "585", "750", "999"], {
    message: "La qualité est requise",
  }),
  poids: z.coerce
    .number({ message: "Le poids est requis" })
    .positive("Le poids doit être positif"),
  quantite: z.coerce.number().int().min(1).default(1),
});

export type ReferenceBijouxFormData = z.infer<typeof referenceBijouxSchema>;

// ============================================================
// Or investissement reference form schema
// ============================================================
export const referenceOrInvestSchema = z.object({
  or_investissement_id: z.string().min(1, "La pièce est requise"),
  designation: z.string().min(1, "La désignation est requise").max(200),
  poids: z.coerce.number().positive("Le poids doit être positif"),
  metal: z.enum(["Or", "Argent", "Platine"]).optional(),
  is_scelle: z.boolean().default(false),
  has_facture: z.boolean().default(false),
  date_acquisition: z.string().optional().or(z.literal("")),
  prix_acquisition: z.coerce.number().min(0).optional(),
  quantite: z.coerce.number().int().min(1).default(1),
});

export type ReferenceOrInvestFormData = z.infer<typeof referenceOrInvestSchema>;
