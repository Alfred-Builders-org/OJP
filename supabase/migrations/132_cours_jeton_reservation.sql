-- ============================================================
-- Migration 132: securiser l'ecriture des cours par jeton de reservation
--
-- Probleme introduit en 131 : `appliquer_cours` est SECURITY DEFINER et
-- accordee a `authenticated`. Un vendeur pouvait donc l'appeler directement
-- et reecrire les cours, contournant la policy `parametres_update` qui
-- reserve l'ecriture au proprietaire (migration 129).
--
-- Correctif : `reserver_maj_cours` emet un jeton a usage unique.
--   - releve quotidien : le porteur du jeton peut ecrire une fois, puis le
--     jeton est consomme. C'est ce qui permet a un vendeur d'ouvrir
--     l'application le matin et de declencher le releve.
--   - bouton manuel : le proprietaire ecrit sans jeton, comme avant.
--   - tout autre appelant est rejete.
-- ============================================================

ALTER TABLE public.parametres
  ADD COLUMN IF NOT EXISTS cours_maj_jeton UUID;

-- ------------------------------------------------------------
-- Reserve le releve du jour et renvoie un jeton a usage unique.
-- Renvoie NULL si le releve du jour a deja ete reserve.
--
-- La version 131 renvoyait un BOOLEAN : Postgres refuse de changer le type de
-- retour d'une fonction existante, il faut donc la supprimer d'abord.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reserver_maj_cours();

CREATE OR REPLACE FUNCTION public.reserver_maj_cours()
RETURNS UUID AS $$
DECLARE
  jeton UUID;
BEGIN
  UPDATE public.parametres
     SET cours_maj_le = now(),
         cours_maj_jeton = gen_random_uuid()
   WHERE id = 1
     AND (cours_maj_le IS NULL OR cours_maj_le < date_trunc('day', now()))
  RETURNING cours_maj_jeton INTO jeton;

  RETURN jeton;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- Ecrit les cours releves.
--   p_jeton renseigne  -> doit correspondre au jeton en cours (usage unique)
--   p_jeton NULL       -> reserve au proprietaire / super_admin
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appliquer_cours(
  p_or NUMERIC,
  p_argent NUMERIC,
  p_platine NUMERIC,
  p_jeton UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  jeton_attendu UUID;
BEGIN
  IF p_or <= 0 OR p_argent <= 0 OR p_platine <= 0 THEN
    RAISE EXCEPTION 'Cours invalide : les trois metaux doivent etre strictement positifs';
  END IF;

  IF p_jeton IS NULL THEN
    IF NOT (public.user_is_active()
            AND public.user_role() IN ('proprietaire', 'super_admin')) THEN
      RAISE EXCEPTION 'Seul un proprietaire peut modifier les cours';
    END IF;
  ELSE
    SELECT cours_maj_jeton INTO jeton_attendu FROM public.parametres WHERE id = 1;
    IF jeton_attendu IS NULL OR jeton_attendu <> p_jeton THEN
      RAISE EXCEPTION 'Jeton de releve invalide ou deja consomme';
    END IF;
  END IF;

  UPDATE public.parametres
     SET prix_or = p_or,
         prix_argent = p_argent,
         prix_platine = p_platine,
         cours_maj_le = now(),
         cours_maj_jeton = NULL  -- usage unique
   WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- L'ancienne signature a 3 arguments laisserait une porte ouverte : on la
-- supprime explicitement.
DROP FUNCTION IF EXISTS public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC);

REVOKE ALL ON FUNCTION public.reserver_maj_cours() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserver_maj_cours() TO authenticated;
GRANT EXECUTE ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC, UUID) TO authenticated;
