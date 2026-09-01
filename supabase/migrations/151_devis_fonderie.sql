-- Le bon de commande partait avec le prix du catalogue : ce que le client paie,
-- pas ce que la fonderie facture. Les deux n'ont rien a voir. Le devis arrive
-- apres l'envoi de la commande, avec ses propres prix et ses frais de port ;
-- ce sont eux qui doivent piloter le reglement de la fonderie.

ALTER TABLE public.vente_lignes
  ADD COLUMN IF NOT EXISTS prix_achat_fonderie NUMERIC(12,2);

COMMENT ON COLUMN public.vente_lignes.prix_achat_fonderie IS
  'Prix unitaire HT facture par la fonderie, releve sur son devis. NULL tant que le devis n''est pas revenu.';

ALTER TABLE public.bons_commande
  ADD COLUMN IF NOT EXISTS frais_annexes NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frais_annexes_libelle TEXT,
  ADD COLUMN IF NOT EXISTS montant_fonderie NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.bons_commande.frais_annexes IS
  'Port, assurance, facon : ce que la fonderie facture en plus des articles.';
COMMENT ON COLUMN public.bons_commande.montant_fonderie IS
  'Ce qu''on doit a la fonderie : somme des prix du devis + frais annexes. Pilote le reglement.';
COMMENT ON COLUMN public.bons_commande.montant_total IS
  'Valeur de vente des articles au catalogue. Sert de reference, jamais de montant a payer.';

-- Somme du devis pour un bon de commande donne.
CREATE OR REPLACE FUNCTION public.somme_devis_fonderie(p_bdc_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(COALESCE(prix_achat_fonderie, 0) * quantite), 0)
  FROM public.vente_lignes
  WHERE bon_commande_id = p_bdc_id;
$$ LANGUAGE sql STABLE;

-- Les deux montants d'un bon de commande, recalcules ensemble.
CREATE OR REPLACE FUNCTION public.recalc_bon_commande_montants(p_bdc_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bons_commande b SET
    montant_total = COALESCE((
      SELECT SUM(prix_total) FROM public.vente_lignes WHERE bon_commande_id = p_bdc_id
    ), 0),
    montant_fonderie = public.somme_devis_fonderie(p_bdc_id) + COALESCE(b.frais_annexes, 0),
    updated_at = now()
  WHERE b.id = p_bdc_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_bon_commande_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.bon_commande_id IS NOT NULL THEN
    PERFORM public.recalc_bon_commande_montants(OLD.bon_commande_id);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.bon_commande_id IS NOT NULL THEN
    PERFORM public.recalc_bon_commande_montants(NEW.bon_commande_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Les frais annexes se saisissent sur le bon lui-meme : le total suit sans
-- repasser par les lignes. `UPDATE OF frais_annexes` ne se declenche que quand
-- la colonne figure dans le SET, ce que recalc_bon_commande_montants ne fait
-- jamais : pas de recursion.
CREATE OR REPLACE FUNCTION public.sync_bon_commande_frais()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_fonderie := public.somme_devis_fonderie(NEW.id)
    + COALESCE(NEW.frais_annexes, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bons_commande_frais_sync ON public.bons_commande;

CREATE TRIGGER bons_commande_frais_sync
  BEFORE UPDATE OF frais_annexes ON public.bons_commande
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bon_commande_frais();

-- Reprise. Les bons deja payes l'ont ete sur le montant du catalogue, faute de
-- mieux : on inscrit ce montant comme prix du devis pour que leurs reglements
-- restent adosses a une somme due. Les bons encore ouverts attendent leur vrai
-- devis, et restent a zero.
UPDATE public.vente_lignes l
SET prix_achat_fonderie = l.prix_unitaire
FROM public.bons_commande b
WHERE l.bon_commande_id = b.id
  AND b.statut = 'paye'
  AND l.prix_achat_fonderie IS NULL;

UPDATE public.bons_commande b SET
  montant_fonderie = public.somme_devis_fonderie(b.id) + COALESCE(b.frais_annexes, 0);
