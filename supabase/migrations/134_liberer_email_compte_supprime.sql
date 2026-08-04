-- ============================================================
-- Migration 134: liberer l'adresse e-mail d'un compte supprime
--
-- La suppression d'un utilisateur est logique : le profil est conserve pour
-- que l'historique reste lisible (« cree par ... » sur les lots, dossiers et
-- clients) et le compte est banni. Mais son adresse restait prise dans
-- auth.users, si bien qu'on ne pouvait plus recreer de compte avec elle.
--
-- Supabase conserve l'adresse a DEUX endroits : auth.users.email et
-- auth.identities.identity_data->>'email'. L'API admin ne garantit pas de
-- mettre le second a jour ; cette fonction traite les deux, ce qui evite que
-- l'adresse reste bloquee a moitie.
--
-- L'adresse d'origine est conservee dans les metadonnees du compte, pour
-- pouvoir retracer qui etait ce compte en cas de besoin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.liberer_email_compte(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_email_origine TEXT;
  v_email_neutre TEXT;
BEGIN
  SELECT email INTO v_email_origine FROM auth.users WHERE id = p_user_id;

  IF v_email_origine IS NULL THEN
    RETURN NULL;
  END IF;

  -- Deja neutralisee : rien a faire, l'operation est rejouable sans risque.
  IF v_email_origine LIKE 'supprime+%@comptes-supprimes.invalid' THEN
    RETURN v_email_origine;
  END IF;

  v_email_neutre := 'supprime+' || p_user_id || '@comptes-supprimes.invalid';

  UPDATE auth.users
     SET email = v_email_neutre,
         raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
           || jsonb_build_object('email_origine', v_email_origine,
                                 'supprime_le', now()),
         email_change = '',
         email_change_token_new = '',
         email_change_token_current = ''
   WHERE id = p_user_id;

  UPDATE auth.identities
     SET identity_data = identity_data
           || jsonb_build_object('email', v_email_neutre)
   WHERE user_id = p_user_id
     AND provider = 'email';

  RETURN v_email_neutre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Reservee au service role : seule la route de suppression, qui verifie deja
-- que l'appelant est proprietaire, doit pouvoir l'invoquer.
REVOKE ALL ON FUNCTION public.liberer_email_compte(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.liberer_email_compte(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.liberer_email_compte(UUID) TO service_role;
