-- ============================================================
-- Migration 129: ouvrir la LECTURE des parametres a tous les roles actifs
--
-- Contexte : depuis 040 (puis 062), parametres_select etait restreint aux
-- roles 'proprietaire' et 'super_admin'. Or les cours des metaux stockes dans
-- cette table servent a calculer TOUS les prix de rachat et de vente.
--
-- Consequence du verrou pour un vendeur :
--   1. getParametres() echoue silencieusement (RLS) et retourne les valeurs
--      par defaut, cours a 0
--   2. la creation d'un lot enregistre des snapshots de cours a 0
--   3. le formulaire de reference calcule un prix de rachat a 0 EUR,
--      sans aucun avertissement
--
-- Correctif : la lecture devient accessible a tout utilisateur actif.
-- L'ECRITURE reste reservee au proprietaire et au super_admin : un vendeur
-- consulte les cours, il ne les modifie pas.
-- ============================================================

DROP POLICY IF EXISTS "parametres_select" ON public.parametres;

CREATE POLICY "parametres_select" ON public.parametres FOR SELECT
  USING (public.user_is_active());

-- Rappel de l'etat attendu de la policy d'ecriture (inchangee, recreee ici
-- pour que cette migration soit auto-portante en cas de rejeu).
DROP POLICY IF EXISTS "parametres_update" ON public.parametres;

CREATE POLICY "parametres_update" ON public.parametres FOR UPDATE
  USING (public.user_is_active() AND public.user_role() IN ('proprietaire', 'super_admin'));
