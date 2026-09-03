-- ============================================================
-- Migration 157 : plusieurs photos par piece d'identite, prises au telephone
--
-- Une piece d'identite ne portait qu'une seule image, dans la colonne
-- `photo_url`. Le recto et le verso en font deja deux, et un titre de sejour
-- davantage. Le mecanisme de prise de vue par QR code existe depuis la
-- migration 147 : le poste affiche un code, le telephone le scanne et depose.
-- Il ne connaissait que les lots et les references.
--
-- La difference avec une photo de bijou n'est pas anodine : le bucket
-- `identity-documents` est PRIVE (R-025), et le jeton de session n'est pas
-- authentifie. Il faut donc qu'il ouvre le moins possible, et le moins
-- longtemps possible.
-- ============================================================

-- ── La cible ─────────────────────────────────────────────────
ALTER TABLE public.photo_sessions
  ADD COLUMN IF NOT EXISTS client_identity_document_id UUID
    REFERENCES public.client_identity_documents(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.photo_sessions.client_identity_document_id IS
  'Piece d''identite photographiee. Vide sur une session de lot ou de reference.';

-- ── La galerie ───────────────────────────────────────────────
-- Meme forme que `lot_photos` : le chemin est unique parce que le depot par
-- telephone et l'ecran du poste peuvent enregistrer la meme image a quelques
-- secondes d'intervalle, et le second doit alors ne rien faire.
CREATE TABLE IF NOT EXISTS public.identity_document_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL
    REFERENCES public.client_identity_documents(id) ON DELETE CASCADE,
  chemin TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL DEFAULT 'identity-documents',
  rang INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS identity_document_photos_document_idx
  ON public.identity_document_photos(document_id, created_at, rang);

COMMENT ON TABLE public.identity_document_photos IS
  'Cliches d''une piece d''identite. La premiere alimente client_identity_documents.photo_url.';

ALTER TABLE public.identity_document_photos ENABLE ROW LEVEL SECURITY;

-- Les memes droits que la piece qu'elles documentent : ni plus, ni moins.
DROP POLICY IF EXISTS "identity_document_photos_select" ON public.identity_document_photos;
CREATE POLICY "identity_document_photos_select" ON public.identity_document_photos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "identity_document_photos_insert" ON public.identity_document_photos;
CREATE POLICY "identity_document_photos_insert" ON public.identity_document_photos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "identity_document_photos_delete" ON public.identity_document_photos;
CREATE POLICY "identity_document_photos_delete" ON public.identity_document_photos
  FOR DELETE TO authenticated USING (true);

-- ── La vignette ──────────────────────────────────────────────
-- `photo_url` reste la premiere photo de la galerie, tenue par declencheur :
-- les ecrans qui n'affichent qu'une vignette la lisent sans jointure, et le
-- formulaire existant continue de fonctionner sans etre reecrit.
CREATE OR REPLACE FUNCTION public.sync_identity_photo_url()
RETURNS TRIGGER AS $$
DECLARE
  v_document_id UUID;
BEGIN
  v_document_id := COALESCE(NEW.document_id, OLD.document_id);

  UPDATE public.client_identity_documents SET
    photo_url = (
      SELECT chemin FROM public.identity_document_photos
      WHERE document_id = v_document_id
      ORDER BY created_at, rang
      LIMIT 1
    )
  WHERE id = v_document_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS identity_photo_url_sync ON public.identity_document_photos;
CREATE TRIGGER identity_photo_url_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.identity_document_photos
  FOR EACH ROW EXECUTE FUNCTION public.sync_identity_photo_url();

-- ── Reprise de l'existant ────────────────────────────────────
-- Les pieces deja saisies portent une photo unique : elle devient la premiere
-- de leur galerie, sans quoi elle disparaitrait de l'ecran au premier ajout.
INSERT INTO public.identity_document_photos (document_id, chemin, bucket, rang)
SELECT id, photo_url, 'identity-documents', 0
FROM public.client_identity_documents
WHERE photo_url IS NOT NULL AND photo_url <> ''
ON CONFLICT (chemin) DO NOTHING;
