-- ============================================================
-- Migration 147 : prendre les photos avec son telephone
--
-- Le poste de la boutique est un ordinateur fixe, sans camera utilisable pour
-- photographier un bijou pose sur le comptoir. Le telephone, lui, est deja dans
-- la main. On ouvre donc une session de prise de vue : l'ecran affiche un QR
-- code, le telephone le scanne, prend une ou plusieurs photos et les depose.
-- L'ordinateur les voit arriver.
--
-- La page du telephone n'est pas authentifiee — c'est tout l'interet, on ne se
-- connecte pas a l'ERP depuis son mobile pour une photo — donc le jeton EST
-- l'autorisation. Il n'ouvre rien d'autre que le depot d'images, sur une cible
-- decidee a l'avance par un utilisateur connecte, et il perime en trente
-- minutes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.photo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jeton porte par l'URL du QR code. Tire cote serveur, jamais devinable.
  token TEXT NOT NULL UNIQUE,

  -- Dossier de rangement dans le bucket, generalement l'identifiant du lot.
  prefixe TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'lot-photos',

  -- Cible. `lot_id` renseigne, les photos sont inscrites a la galerie des leur
  -- depot : le poste peut fermer son onglet, elles arrivent quand meme.
  -- `reference_id` vide sur une session de reference signifie que la reference
  -- n'existe pas encore — le formulaire les rattachera a l'enregistrement.
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  reference_id UUID REFERENCES public.lot_references(id) ON DELETE CASCADE,

  -- Affiche sur le telephone, pour savoir ce qu'on photographie quand deux
  -- sessions sont ouvertes cote a cote.
  libelle TEXT,

  expire_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photo_sessions_token_idx ON public.photo_sessions(token);
CREATE INDEX IF NOT EXISTS photo_sessions_expire_idx ON public.photo_sessions(expire_at);

COMMENT ON TABLE public.photo_sessions IS
  'Sessions de prise de vue par telephone, ouvertes depuis un poste, closes par l''expiration du jeton.';

-- Les depots de la session. Table a part plutot qu'une colonne : une session
-- accueille autant de photos que le vendeur en prend, sans allee-retour a
-- l'ecran entre chaque.
CREATE TABLE IF NOT EXISTS public.photo_session_fichiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.photo_sessions(id) ON DELETE CASCADE,
  chemin TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photo_session_fichiers_session_idx
  ON public.photo_session_fichiers(session_id, created_at);

ALTER TABLE public.photo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_session_fichiers ENABLE ROW LEVEL SECURITY;

-- Un utilisateur connecte ouvre une session et suit la sienne. Le telephone, lui,
-- ne passe pas par RLS : il passe par une route serveur qui verifie le jeton et
-- l'expiration avec la cle de service.
DROP POLICY IF EXISTS "photo_sessions_insert" ON public.photo_sessions;
CREATE POLICY "photo_sessions_insert" ON public.photo_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "photo_sessions_select" ON public.photo_sessions;
CREATE POLICY "photo_sessions_select" ON public.photo_sessions
  FOR SELECT TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "photo_sessions_delete" ON public.photo_sessions;
CREATE POLICY "photo_sessions_delete" ON public.photo_sessions
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "photo_session_fichiers_select" ON public.photo_session_fichiers;
CREATE POLICY "photo_session_fichiers_select" ON public.photo_session_fichiers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.photo_sessions s
      WHERE s.id = session_id AND s.created_by = auth.uid()
    )
  );

-- Une session perimee n'a plus de valeur : on ne garde pas un jeton dormant.
CREATE OR REPLACE FUNCTION public.purger_photo_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.photo_sessions
  WHERE expire_at < NOW() - INTERVAL '1 day';
$$;

COMMENT ON FUNCTION public.purger_photo_sessions IS
  'Supprime les sessions de prise de vue perimees depuis plus d''un jour.';
