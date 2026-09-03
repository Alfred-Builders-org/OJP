-- ============================================================
-- Migration 159 : envoyer un lingot ou une piece a la fonte
--
-- `bon_livraison_lignes.bijoux_stock_id` etait NOT NULL : un envoi en fonderie
-- ne pouvait porter que des bijoux de l'inventaire. La boutique fond aussi des
-- lingots et des pieces de son catalogue d'investissement — un produit qui ne
-- se vend pas, un lot de pieces rachetees dont la prime s'est effondree.
--
-- Une difference de nature merite d'etre dite : un bijou du stock est une piece
-- unique, qui passe au statut « fondu ». Un produit d'investissement est un
-- COMPTEUR : on en envoie une quantite, et le stock diminue d'autant. D'ou la
-- colonne `quantite`, qui n'avait pas lieu d'etre tant qu'une ligne valait un
-- objet.
-- ============================================================

ALTER TABLE public.bon_livraison_lignes
  ALTER COLUMN bijoux_stock_id DROP NOT NULL;

ALTER TABLE public.bon_livraison_lignes
  ADD COLUMN IF NOT EXISTS or_investissement_id UUID
    REFERENCES public.or_investissement(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS quantite INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.bon_livraison_lignes.or_investissement_id IS
  'Produit du catalogue d''investissement envoye a la fonte. Exclusif avec bijoux_stock_id.';
COMMENT ON COLUMN public.bon_livraison_lignes.quantite IS
  'Nombre d''exemplaires envoyes. Toujours 1 pour un bijou du stock, qui est unique.';

-- Une ligne designe un bijou du stock, ou un produit du catalogue. Jamais les
-- deux : le poids et la valeur seraient comptes deux fois.
ALTER TABLE public.bon_livraison_lignes
  DROP CONSTRAINT IF EXISTS bon_livraison_lignes_une_source;
ALTER TABLE public.bon_livraison_lignes
  ADD CONSTRAINT bon_livraison_lignes_une_source
  CHECK (num_nonnulls(bijoux_stock_id, or_investissement_id) = 1);

ALTER TABLE public.bon_livraison_lignes
  DROP CONSTRAINT IF EXISTS bon_livraison_lignes_quantite_positive;
ALTER TABLE public.bon_livraison_lignes
  ADD CONSTRAINT bon_livraison_lignes_quantite_positive
  CHECK (quantite >= 1);

CREATE INDEX IF NOT EXISTS bon_livraison_lignes_or_invest_idx
  ON public.bon_livraison_lignes(or_investissement_id)
  WHERE or_investissement_id IS NOT NULL;

-- ── Sortir du catalogue sans passer sous zero ────────────────
--
-- R-021 : le stock d'un produit d'investissement ne passe jamais sous zero.
-- La decrementation se fait donc en base, sous verrou de ligne, et non en
-- lisant puis ecrivant depuis le navigateur — deux envois simultanes y
-- passeraient tous les deux.
CREATE OR REPLACE FUNCTION public.sortir_or_investissement(
  p_or_investissement_id UUID,
  p_quantite INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_restant INTEGER;
  v_designation TEXT;
BEGIN
  IF p_quantite IS NULL OR p_quantite < 1 THEN
    RAISE EXCEPTION 'La quantite a sortir doit valoir au moins 1.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT quantite, designation INTO v_restant, v_designation
  FROM public.or_investissement
  WHERE id = p_or_investissement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit d''investissement introuvable.'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_restant < p_quantite THEN
    RAISE EXCEPTION
      'Stock insuffisant pour % : % en stock, % demandes.',
      v_designation, v_restant, p_quantite
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.or_investissement
  SET quantite = quantite - p_quantite
  WHERE id = p_or_investissement_id
  RETURNING quantite INTO v_restant;

  RETURN v_restant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.sortir_or_investissement(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sortir_or_investissement(UUID, INTEGER) TO authenticated;
