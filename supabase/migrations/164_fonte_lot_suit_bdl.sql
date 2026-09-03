-- ============================================================
-- Migration 164 : le lot de fonte suit l'etat de son bon de livraison
--
-- Un lot de fonte (migration 163) est le conteneur d'un envoi ; son etat reel
-- vit sur le bon de livraison (envoye -> recu -> traite -> paye). Sans lien, le
-- lot resterait « en cours » a jamais et s'entasserait dans les operations. On
-- le clot donc quand l'envoi est traite ou paye.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fonte_lot_suit_bdl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lot_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.statut IN ('traite', 'paye') THEN
    UPDATE public.lots
    SET status = 'finalise', outcome = 'complete',
        date_finalisation = COALESCE(date_finalisation, now())
    WHERE id = NEW.lot_id AND status <> 'finalise' AND type = 'fonte';
  ELSIF NEW.statut = 'annule' THEN
    UPDATE public.lots
    SET status = 'finalise', outcome = 'annule',
        date_finalisation = COALESCE(date_finalisation, now())
    WHERE id = NEW.lot_id AND status <> 'finalise' AND type = 'fonte';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fonte_lot_suit_bdl_trigger ON public.bons_livraison;
CREATE TRIGGER fonte_lot_suit_bdl_trigger
  AFTER UPDATE OF statut ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.fonte_lot_suit_bdl();
