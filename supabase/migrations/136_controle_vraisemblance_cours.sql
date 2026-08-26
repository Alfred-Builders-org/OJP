-- ============================================================
-- Migration 136 : refuser un cours manifestement aberrant
--
-- Constat de recette : la reference « Bracelet » du lot RAC-2026-0004 est
-- valorisee 3 439,06 EUR pour 90 g d'argent. Le calcul est juste — le cours
-- enregistre ce jour-la etait de 45,00 EUR/g pour de l'argent, dont le cours
-- reel avoisine 1,80 EUR/g. Une saisie manuelle erronee suffit a fausser
-- toutes les transactions de la journee, sans qu'aucun controle ne s'y oppose :
-- `appliquer_cours` ne verifiait que la positivite.
--
-- Regle posee : un ecart de plus de 30 % avec le dernier releve connu est
-- refuse. Le seuil est large — les metaux precieux ne bougent pas de 30 % en
-- une journee — mais il arrete net une virgule mal placee ou un metal saisi
-- dans la mauvaise case.
--
-- Le proprietaire garde la main via p_forcer, pour le cas ou un ecart reel
-- devrait etre enregistre. Le releve automatique quotidien ne force jamais :
-- en cas de rejet, les cours de la veille sont conserves, exactement comme
-- lorsque goldapi est injoignable.
-- ============================================================

DROP FUNCTION IF EXISTS public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC, UUID);

CREATE OR REPLACE FUNCTION public.appliquer_cours(
  p_or NUMERIC,
  p_argent NUMERIC,
  p_platine NUMERIC,
  p_jeton UUID DEFAULT NULL,
  p_forcer BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  jeton_attendu UUID;
  ancien RECORD;
  ecart_max CONSTANT NUMERIC := 0.30;
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
    -- Un releve automatique ne force jamais.
    p_forcer := FALSE;
  END IF;

  IF NOT p_forcer THEN
    SELECT prix_or, prix_argent, prix_platine INTO ancien
    FROM public.parametres WHERE id = 1;

    -- Un cours a zero signifie « jamais releve » : rien a comparer.
    IF ancien.prix_or > 0 AND abs(p_or - ancien.prix_or) / ancien.prix_or > ecart_max THEN
      RAISE EXCEPTION
        'Cours de l''or invraisemblable : % EUR/g contre % EUR/g au dernier releve. Verifiez la saisie, ou forcez si l''ecart est reel.',
        round(p_or, 3), round(ancien.prix_or, 3)
        USING ERRCODE = 'check_violation';
    END IF;

    IF ancien.prix_argent > 0 AND abs(p_argent - ancien.prix_argent) / ancien.prix_argent > ecart_max THEN
      RAISE EXCEPTION
        'Cours de l''argent invraisemblable : % EUR/g contre % EUR/g au dernier releve. Verifiez la saisie, ou forcez si l''ecart est reel.',
        round(p_argent, 3), round(ancien.prix_argent, 3)
        USING ERRCODE = 'check_violation';
    END IF;

    IF ancien.prix_platine > 0 AND abs(p_platine - ancien.prix_platine) / ancien.prix_platine > ecart_max THEN
      RAISE EXCEPTION
        'Cours du platine invraisemblable : % EUR/g contre % EUR/g au dernier releve. Verifiez la saisie, ou forcez si l''ecart est reel.',
        round(p_platine, 3), round(ancien.prix_platine, 3)
        USING ERRCODE = 'check_violation';
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

REVOKE ALL ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.appliquer_cours(NUMERIC, NUMERIC, NUMERIC, UUID, BOOLEAN) TO authenticated;
