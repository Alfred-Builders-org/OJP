-- ============================================================
-- Migration 133: document de remboursement apres retractation
--
-- Contexte : le reglement d'un rachat est desormais possible pendant le delai
-- legal de 48 h, car en boutique le client repart le plus souvent avec son
-- argent le jour meme. Si ce client se retracte ensuite, il rend la somme —
-- et ce mouvement doit laisser une trace comptable.
--
-- Le remboursement est enregistre comme un reglement de type 'rachat', sens
-- 'sortant', de montant NEGATIF : la somme des reglements du lot retombe ainsi
-- naturellement a zero, sans qu'aucun calcul existant n'ait a distinguer les
-- sens. Il est rattache a un document dedie, le recu de remboursement.
-- ============================================================

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'quittance_rachat', 'contrat_rachat', 'devis_rachat',
    'contrat_depot_vente', 'confie_achat', 'quittance_depot_vente',
    'facture_vente', 'facture_acompte', 'facture_solde',
    'bon_commande', 'bon_livraison',
    'remboursement_retractation'
  ));

-- Prefixe RBT dans la numerotation automatique des documents.
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
