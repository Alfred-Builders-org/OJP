-- ============================================================
-- Migration 146 : photographier ce qui entre en boutique
--
-- Un lot de rachat ou de depot-vente doit etre photographie a la prise en
-- charge. C'est la preuve de ce qui a ete remis, et le seul recours en cas de
-- contestation sur l'etat ou la composition de ce que le client a apporte.
--
-- Une photo ne suffit pas : un lot, c'est un tas d'objets qu'on etale, qu'on
-- retourne, dont on veut le poinçon en gros plan. On stocke donc une GALERIE.
-- La colonne `lots.photo_url`, jusqu'ici vide et jamais lue, devient la
-- premiere photo de cette galerie, tenue a jour par declencheur : les ecrans
-- qui n'ont besoin que d'une vignette la lisent sans jointure.
-- ============================================================

ALTER TABLE public.lot_references
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN public.lot_references.photo_url IS
  'Premiere photo de l''article. Denormalisation de lot_photos, tenue par declencheur.';

COMMENT ON COLUMN public.lots.photo_url IS
  'Premiere photo du lot. Denormalisation de lot_photos, tenue par declencheur.';

-- ── La galerie ──────────────────────────────────────────────
--
-- `lot_id` est toujours renseigne, meme pour la photo d'une reference : c'est
-- lui qui commande le rangement dans le bucket et la suppression en cascade.
-- `reference_id` vide signifie « photo du lot entier ».
CREATE TABLE IF NOT EXISTS public.lot_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  reference_id UUID REFERENCES public.lot_references(id) ON DELETE CASCADE,

  -- Chemin dans le bucket. Unique : le depot par telephone et l'ecran du poste
  -- peuvent enregistrer la meme photo a quelques secondes d'intervalle, et le
  -- second doit alors ne rien faire plutot que de la doubler.
  chemin TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL DEFAULT 'lot-photos',

  rang INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lot_photos_lot_idx ON public.lot_photos(lot_id, rang);
CREATE INDEX IF NOT EXISTS lot_photos_reference_idx ON public.lot_photos(reference_id, rang);

COMMENT ON TABLE public.lot_photos IS
  'Photos prises a la prise en charge. reference_id vide = photo du lot entier.';

ALTER TABLE public.lot_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lot_photos_select" ON public.lot_photos;
CREATE POLICY "lot_photos_select" ON public.lot_photos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_insert" ON public.lot_photos;
CREATE POLICY "lot_photos_insert" ON public.lot_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_update" ON public.lot_photos;
CREATE POLICY "lot_photos_update" ON public.lot_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_delete" ON public.lot_photos;
CREATE POLICY "lot_photos_delete" ON public.lot_photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── La vignette de tete ─────────────────────────────────────
--
-- Recalculee a chaque mouvement de la galerie. On vise la ligne concernee, pas
-- la table entiere : une suppression de photo ne doit pas relire tout le stock.
CREATE OR REPLACE FUNCTION public.rafraichir_photo_principale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot UUID := COALESCE(NEW.lot_id, OLD.lot_id);
  v_ref UUID := COALESCE(NEW.reference_id, OLD.reference_id);
BEGIN
  UPDATE public.lots l
  SET photo_url = (
    SELECT p.chemin FROM public.lot_photos p
    WHERE p.lot_id = v_lot AND p.reference_id IS NULL
    ORDER BY p.rang, p.created_at
    LIMIT 1
  )
  WHERE l.id = v_lot;

  IF v_ref IS NOT NULL THEN
    UPDATE public.lot_references r
    SET photo_url = (
      SELECT p.chemin FROM public.lot_photos p
      WHERE p.reference_id = v_ref
      ORDER BY p.rang, p.created_at
      LIMIT 1
    )
    WHERE r.id = v_ref;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_rafraichir_photo_principale ON public.lot_photos;
CREATE TRIGGER trg_rafraichir_photo_principale
  AFTER INSERT OR UPDATE OR DELETE ON public.lot_photos
  FOR EACH ROW EXECUTE FUNCTION public.rafraichir_photo_principale();

-- ── Le bucket ───────────────────────────────────────────────
--
-- Prive : ces photos montrent des biens de valeur et, souvent, le plan de
-- travail de la boutique. Elles se consultent authentifie, par URL signee.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lot-photos', 'lot-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "lot_photos_storage_insert" ON storage.objects;
CREATE POLICY "lot_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lot-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_storage_select" ON storage.objects;
CREATE POLICY "lot_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lot-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_storage_update" ON storage.objects;
CREATE POLICY "lot_photos_storage_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lot-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "lot_photos_storage_delete" ON storage.objects;
CREATE POLICY "lot_photos_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lot-photos' AND auth.role() = 'authenticated');
