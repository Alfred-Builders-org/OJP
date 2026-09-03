-- ============================================================
-- Migration 163 : la fonte devient un lot dans le dossier de la fonderie
--
-- Envoyer de l'or a fondre, c'est le vendre a une fonderie. Jusqu'ici cela vivait
-- a part (routage + bons de livraison), hors du monde dossier/lot, donc invisible
-- dans les operations. La cliente veut tout suivre au meme endroit : un dossier
-- permanent par fonderie, et chaque envoi un lot.
--
-- Le bon de livraison reste le document et le porteur des lignes (articles, ecarts
-- de titrage/poids constates au retour). Le lot est le conteneur qui le rattache a
-- la fonderie et le fait apparaitre dans les operations.
-- ============================================================

-- Un quatrieme type de lot : la fonte.
ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_type_check;
ALTER TABLE public.lots ADD CONSTRAINT lots_type_check
  CHECK (type IN ('rachat', 'vente', 'depot_vente', 'fonte'));

-- Le bon de livraison connait le dossier et le lot de fonte qui le portent.
ALTER TABLE public.bons_livraison
  ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bons_livraison_lot_id_idx
  ON public.bons_livraison(lot_id) WHERE lot_id IS NOT NULL;

COMMENT ON COLUMN public.bons_livraison.lot_id IS
  'Lot de fonte (type fonte) qui porte cet envoi. Le lot vit dans le dossier permanent de la fonderie.';
