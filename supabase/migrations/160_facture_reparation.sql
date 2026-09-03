-- ============================================================
-- Migration 160 : la reparation a sa facture
--
-- Une reparation etait une ligne qu'on encaissait, sans piece. La cliente veut
-- une vraie facture de prestation, numerotee et rangee dans les documents comme
-- celle d'un lot. C'est un service : TVA normale (20 %), pas la TVA sur marge
-- des reventes.
--
-- La facture est un DOCUMENT (le PDF), rattache a la reparation. On ne touche
-- pas ici a la table comptable `factures` (TVA sur marge) : l'integration de la
-- TVA de prestation a la declaration est un chantier a part, hors de ce lot.
-- ============================================================

-- Le document connait la reparation qu'il facture.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS reparation_id UUID
    REFERENCES public.reparations(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.documents.reparation_id IS
  'Reparation facturee. Renseigne sur les documents de type facture_reparation.';

CREATE INDEX IF NOT EXISTS documents_reparation_idx
  ON public.documents(reparation_id) WHERE reparation_id IS NOT NULL;

-- Nouveau type de document.
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'quittance_rachat', 'contrat_rachat', 'devis_rachat',
    'contrat_depot_vente', 'confie_achat', 'quittance_depot_vente',
    'facture_vente', 'facture_acompte', 'facture_solde',
    'bon_commande', 'bon_livraison',
    'remboursement_retractation',
    'facture_reparation'
  ));

-- Prefixe FACR dans la numerotation automatique. Corps repris a l'identique de
-- la migration 133, augmente d'une branche.
CREATE OR REPLACE FUNCTION public.generate_document_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
  v_prefix TEXT;
BEGIN
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('document_numero'));

  v_year := EXTRACT(YEAR FROM now())::TEXT;

  v_prefix := CASE NEW.type
    WHEN 'quittance_rachat' THEN 'QRA'
    WHEN 'contrat_rachat' THEN 'CRA'
    WHEN 'devis_rachat' THEN 'DEV'
    WHEN 'contrat_depot_vente' THEN 'CDV'
    WHEN 'confie_achat' THEN 'CON'
    WHEN 'quittance_depot_vente' THEN 'QDV'
    WHEN 'facture_vente' THEN 'FVE'
    WHEN 'facture_acompte' THEN 'FAC'
    WHEN 'facture_solde' THEN 'FSO'
    WHEN 'bon_commande' THEN 'CMDF'
    WHEN 'bon_livraison' THEN 'BDL'
    WHEN 'remboursement_retractation' THEN 'RBT'
    WHEN 'facture_reparation' THEN 'FACR'
    ELSE 'DOC'
  END;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero FROM v_prefix || '-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM public.documents
  WHERE numero LIKE v_prefix || '-' || v_year || '-%';

  NEW.numero := v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
