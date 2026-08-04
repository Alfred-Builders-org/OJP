-- ============================================================
-- Migration 131: rafraichissement quotidien des cours
--
-- Regle metier : les cours sont releves UNE fois par jour. Toute la journee,
-- les lots sont crees sur ce meme cours — ce qui garantit qu'un client
-- expertise le matin et un autre l'apres-midi sont traites a l'identique.
--
-- Mecanisme : au premier chargement du tableau de bord de la journee, l'app
-- tente de reserver le rafraichissement. La reservation est un UPDATE
-- conditionnel atomique : si deux utilisateurs ouvrent l'application en meme
-- temps, un seul obtient la reservation et un seul appel part vers goldapi.
--
-- La colonne `cours_maj_le` trace la TENTATIVE, pas le succes. Si goldapi est
-- injoignable, la journee est consommee et l'on ne reessaie pas en boucle :
-- cela protege le quota de l'API. Le bouton « Actualiser au cours du marche »
-- reste disponible pour forcer un relevé.
-- ============================================================

ALTER TABLE public.parametres
  ADD COLUMN IF NOT EXISTS cours_maj_le TIMESTAMPTZ;

-- ------------------------------------------------------------
-- Reserve le rafraichissement du jour.
-- Renvoie true si l'appelant doit effectuer le relevé, false sinon.
--
-- SECURITY DEFINER : un vendeur n'a pas le droit d'ecrire dans parametres
-- (migration 129), mais il doit pouvoir declencher le relevé quotidien en
-- ouvrant l'application le matin.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserver_maj_cours()
RETURNS BOOLEAN AS $$
DECLARE
  reserve BOOLEAN;
BEGIN
  UPDATE public.parametres
     SET cours_maj_le = now()
   WHERE id = 1
     AND (cours_maj_le IS NULL OR cours_maj_le < date_trunc('day', now()))
  RETURNING true INTO reserve;

  RETURN COALESCE(reserve, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- Applique les cours releves. Appelee uniquement apres une reservation
-- obtenue, ou depuis le bouton manuel du proprietaire.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appliquer_cours(
  p_or NUMERIC,
  p_argent NUMERIC,
  p_platine NUMERIC
)
RETURNS VOID AS $$
BEGIN
  IF p_or <= 0 OR p_argent <= 0 OR p_platine <= 0 THEN
    RAISE EXCEPTION 'Cours invalide : les trois metaux doivent etre strictement positifs';
  END IF;

  UPDATE public.parametres
     SET prix_or = p_or,
         prix_argent = p_argent,
         prix_platine = p_platine,
         cours_maj_le = now()
   WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.reserver_maj_cours() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserver_maj_cours() TO authenticated;
GRANT EXECUTE ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC) TO authenticated;
