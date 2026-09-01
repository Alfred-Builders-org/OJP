-- ============================================================
-- Migration 145 : encaisser ce que la fonderie verse pour un envoi
--
-- Les reglements ne savaient rattacher qu'un lot ou un bon de commande : on
-- pouvait tracer ce qu'on paie a la fonderie, jamais ce qu'elle nous verse en
-- retour d'une fonte. L'argent rentrait sans laisser d'ecriture, et la fiche
-- fonderie affichait un solde qui ne comptait qu'un sens.
--
-- Un envoi en fonte ne se rattache a aucun lot : il regroupe des bijoux de
-- stock qui viennent de rachats differents, parfois d'aucun. `lot_id` devient
-- donc facultatif, et `bon_livraison_id` prend le relais. Une contrainte
-- garantit qu'un reglement reste accroche a quelque chose.
--
-- Le statut « paye » manquait aux envois alors que les bons de commande
-- l'avaient deja : un envoi traite mais impaye ne se distinguait pas d'un envoi
-- solde.
-- ============================================================

ALTER TABLE public.reglements
  ADD COLUMN IF NOT EXISTS bon_livraison_id UUID REFERENCES public.bons_livraison(id) ON DELETE SET NULL;

ALTER TABLE public.reglements ALTER COLUMN lot_id DROP NOT NULL;

-- Un reglement sans aucun rattachement serait une ecriture orpheline,
-- impossible a rapprocher.
ALTER TABLE public.reglements DROP CONSTRAINT IF EXISTS reglements_rattachement_check;
ALTER TABLE public.reglements ADD CONSTRAINT reglements_rattachement_check
  CHECK (lot_id IS NOT NULL OR bon_commande_id IS NOT NULL OR bon_livraison_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS reglements_bon_livraison_idx
  ON public.reglements(bon_livraison_id);

ALTER TABLE public.bons_livraison DROP CONSTRAINT IF EXISTS bons_livraison_statut_check;
ALTER TABLE public.bons_livraison ADD CONSTRAINT bons_livraison_statut_check
  CHECK (statut = ANY (ARRAY['brouillon'::text, 'envoye'::text, 'recu'::text, 'traite'::text, 'paye'::text, 'annule'::text]));

COMMENT ON COLUMN public.reglements.bon_livraison_id IS
  'Envoi en fonte que ce reglement solde. Le sens est « entrant » : c''est la fonderie qui paie.';
