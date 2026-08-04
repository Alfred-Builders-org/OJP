-- ============================================================
-- Migration 130: porter les cours des metaux au millieme d'euro
--
-- Contexte : les cours au gramme etaient stockes en NUMERIC(10,2), alors que
-- le formulaire des parametres accepte deja 3 decimales (step="0.001").
-- L'ecart est negligeable sur l'or (113,357 -> 113,36) mais significatif sur
-- l'argent, dont le cours au gramme est de l'ordre de 1,644 EUR : arrondir au
-- centime represente ~0,25 % d'erreur, soit 32 centimes sur 100 g titres 800.
--
-- Toute la chaine est elargie, sinon la precision serait perdue des l'etape
-- suivante :
--   parametres.prix_*  ->  lots.cours_*_snapshot  ->  lot_references.cours_metal_utilise
--                      ->  bon_livraison_lignes.cours_utilise
--
-- Elargir l'echelle d'un NUMERIC est une operation sans perte : les valeurs
-- existantes sont simplement completees par un zero (89.00 -> 89.000).
-- La precision totale reste 10, ce qui autorise des cours jusqu'a
-- 9 999 999,999 EUR/g — tres au-dela de tout usage reel.
-- ============================================================

ALTER TABLE public.parametres
  ALTER COLUMN prix_or     TYPE NUMERIC(10,3),
  ALTER COLUMN prix_argent TYPE NUMERIC(10,3),
  ALTER COLUMN prix_platine TYPE NUMERIC(10,3);

ALTER TABLE public.lots
  ALTER COLUMN cours_or_snapshot      TYPE NUMERIC(10,3),
  ALTER COLUMN cours_argent_snapshot  TYPE NUMERIC(10,3),
  ALTER COLUMN cours_platine_snapshot TYPE NUMERIC(10,3);

ALTER TABLE public.lot_references
  ALTER COLUMN cours_metal_utilise TYPE NUMERIC(10,3);

ALTER TABLE public.bon_livraison_lignes
  ALTER COLUMN cours_utilise TYPE NUMERIC(10,3);
