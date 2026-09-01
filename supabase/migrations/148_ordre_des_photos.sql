-- ============================================================
-- Migration 148 : departager deux photos envoyees ensemble
--
-- Le telephone envoie ses cliches en une seule instruction : ils partagent donc
-- le meme `created_at` a la microseconde. Trier par `rang, created_at` ne les
-- departageait pas — l'ordre de la galerie variait d'un affichage a l'autre,
-- ce qui est genant quand la deuxieme photo est le gros plan du poinçon de la
-- premiere.
--
-- On inverse : `created_at` mene, et `rang` departage au sein d'un meme envoi.
-- ============================================================

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
    ORDER BY p.created_at, p.rang
    LIMIT 1
  )
  WHERE l.id = v_lot;

  IF v_ref IS NOT NULL THEN
    UPDATE public.lot_references r
    SET photo_url = (
      SELECT p.chemin FROM public.lot_photos p
      WHERE p.reference_id = v_ref
      ORDER BY p.created_at, p.rang
      LIMIT 1
    )
    WHERE r.id = v_ref;
  END IF;

  RETURN NULL;
END;
$$;
