-- ============================================================
-- Migration 137 : le depot-vente n'est pas une destination de reference
--
-- Constat de recette (parcours 7, etape 8) : le menu « Destination des
-- references » proposait Stock boutique / Fonderie / Depot-vente. Or un
-- depot-vente suppose un lot de depot-vente a part entiere, avec son contrat et
-- son deposant — on ne peut pas y router une reference de rachat. Le choix
-- existait, ne menait nulle part, et laissait croire a un parcours qui n'existe
-- pas.
--
-- Les references de rachat partent donc en stock boutique ou en fonderie.
-- La colonne reste NULLABLE : « non definie » est un etat legitime tant que le
-- delai de retractation court. A l'expiration, le code traite une destination
-- absente comme un stock boutique, plutot que de laisser la marchandise
-- introuvable.
--
-- Les lignes portant deja 'depot_vente' repassent a NULL. Elles sont, par
-- construction, des references dont la destination n'a jamais ete honoree.
-- ============================================================

UPDATE public.lot_references
SET destination = NULL
WHERE destination = 'depot_vente';

ALTER TABLE public.lot_references
  DROP CONSTRAINT IF EXISTS lot_references_destination_check;

ALTER TABLE public.lot_references
  ADD CONSTRAINT lot_references_destination_check
  CHECK (destination IN ('stock_boutique', 'fonderie'));
