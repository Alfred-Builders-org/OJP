-- ============================================================
-- Migration 135 : interdire de payer un client sur une operation sans suite
--
-- Constat de recette (13 aout) : le lot RAC-2026-0010 porte a la fois
-- outcome = 'retracte' et mode_reglement = 'virement'. Une rétractation avait
-- ete enregistree, puis le client paye malgre tout — sans que rien ne s'y
-- oppose. Meme situation possible sur un devis refuse (RAC-2026-0013).
--
-- Un lot retracte ou refuse est marque 'finalise' comme un lot mene a terme :
-- seul `outcome` les distingue. La verification cote interface ne suffit pas,
-- un reglement pouvant etre saisi hors du parcours « paiement du » (les deux
-- reglements fautifs ont un document_id nul).
--
-- Portee volontairement etroite : seul le versement AU client est bloque
-- (sens = 'sortant' ET type = 'rachat'). Un mouvement entrant reste permis :
-- c'est precisement ce qui se passe quand un client rembourse la somme percue
-- apres s'etre retracte (cf. le recu RBT, migration 133).
-- ============================================================

CREATE OR REPLACE FUNCTION public.bloquer_reglement_operation_sans_suite()
RETURNS TRIGGER AS $$
DECLARE
  v_outcome TEXT;
  v_numero TEXT;
BEGIN
  IF NEW.sens <> 'sortant' OR NEW.type <> 'rachat' THEN
    RETURN NEW;
  END IF;

  SELECT outcome, numero INTO v_outcome, v_numero
  FROM public.lots
  WHERE id = NEW.lot_id;

  IF v_outcome IN ('retracte', 'refuse', 'annule') THEN
    RAISE EXCEPTION
      'Aucun paiement n''est du sur le lot % : l''operation est close (%).',
      v_numero, v_outcome
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS bloquer_reglement_operation_sans_suite_trigger ON public.reglements;

CREATE TRIGGER bloquer_reglement_operation_sans_suite_trigger
  BEFORE INSERT OR UPDATE ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquer_reglement_operation_sans_suite();
