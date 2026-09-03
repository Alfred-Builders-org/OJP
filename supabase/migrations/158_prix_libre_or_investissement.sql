-- ============================================================
-- Migration 158 : negocier le prix d'un produit d'investissement
--
-- Le prix d'un lingot ou d'une piece etait calcule et affiche en lecture seule.
-- Au comptoir, il se negocie : une piece abimee part moins cher, un client
-- fidele obtient un geste, un bon cadeau n'a pas de cours du tout.
--
-- Laisser saisir un prix ne suffit pas : sans memoire du prix calcule, plus
-- rien ne distingue une remise consentie d'une faute de frappe. On garde donc
-- les deux — ce que la formule disait, et ce qui a ete pratique.
-- ============================================================

ALTER TABLE public.vente_lignes
  ADD COLUMN IF NOT EXISTS prix_theorique NUMERIC(12,2);

COMMENT ON COLUMN public.vente_lignes.prix_theorique IS
  'Prix unitaire calcule au cours du jour, avant negociation. NULL : le prix n''a pas ete modifie.';

-- Rien a reprendre sur les lignes existantes : `prix_theorique` vide signifie
-- « prix non negocie », ce qui est le cas de toutes celles saisies jusqu'ici.
