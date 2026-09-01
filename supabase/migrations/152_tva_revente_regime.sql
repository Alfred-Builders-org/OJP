-- Le regime de TVA d'une revente ne depend pas du bijou, mais de qui l'a vendu
-- a la boutique.
--
-- Rachete a un particulier, le bijou se revend sous le regime des biens
-- d'occasion : la TVA porte sur la seule marge, et se calcule en 20/120 du prix
-- de vente diminue du prix d'achat (art. 297 A du CGI). La taxe forfaitaire sur
-- les objets precieux, elle, s'est deja appliquee au rachat, sur la quittance du
-- particulier : elle n'a rien a faire sur la facture du client final.
--
-- Achete a un grossiste assujetti qui a facture sa TVA, le meme bijou se revend
-- en TVA classique sur le prix total, et la TVA de l'achat se deduit.

-- 1. La provenance fiscale d'un article en stock ------------------------------

ALTER TABLE public.bijoux_stock
  ADD COLUMN prix_achat_ht NUMERIC(12,2),
  ADD COLUMN tva_achat_taux NUMERIC(5,2),
  ADD COLUMN tva_achat_montant NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN regime_tva_revente TEXT NOT NULL DEFAULT 'marge'
    CHECK (regime_tva_revente IN ('marge', 'normal'));

COMMENT ON COLUMN public.bijoux_stock.prix_achat_ht IS
  'Prix d''achat hors taxe, renseigne quand le vendeur etait assujetti. NULL pour un rachat a un particulier, ou il n''y a pas de HT.';
COMMENT ON COLUMN public.bijoux_stock.tva_achat_taux IS
  'Taux de TVA porte par la facture d''achat, en pourcentage. NULL quand l''achat n''en portait aucune.';
COMMENT ON COLUMN public.bijoux_stock.regime_tva_revente IS
  'marge = biens d''occasion, art. 297 A du CGI. normal = TVA sur le prix total, avec deduction de celle de l''achat.';

-- Les articles deja en stock qui viennent d'un grossiste n'ont jamais releve du
-- regime de la marge : leur facture d'achat portait la TVA. Le montant de cette
-- TVA ne se retrouve pas apres coup — le prix saisi ne disait pas s'il etait HT
-- ou TTC — mais le regime, lui, ne fait aucun doute.
UPDATE public.bijoux_stock
   SET regime_tva_revente = 'normal'
 WHERE grossiste_id IS NOT NULL;

-- 2. Le regime retenu sur une ligne de vente ----------------------------------

-- Le regime de la marge n'est pas obligatoire : sur n'importe quelle vente, la
-- boutique peut y renoncer et facturer la TVA sur le prix total. Cela n'a
-- d'interet que si le client est un professionnel qui veut la recuperer.
ALTER TABLE public.vente_lignes
  DROP CONSTRAINT IF EXISTS vente_lignes_type_taxe_check;

ALTER TABLE public.vente_lignes
  ADD CONSTRAINT vente_lignes_type_taxe_check
  CHECK (type_taxe IN ('tva_marge', 'tva_normale', 'tfop'));

ALTER TABLE public.vente_lignes
  ADD COLUMN taux_tva NUMERIC(5,2),
  ADD COLUMN prix_achat_origine NUMERIC(12,2),
  ADD COLUMN option_tva_prix_total BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vente_lignes.prix_achat_origine IS
  'Prix d''achat du bijou fige au moment de la vente. Le registre de marge s''appuie dessus : il ne doit pas bouger si la fiche stock est corrigee plus tard.';
COMMENT ON COLUMN public.vente_lignes.option_tva_prix_total IS
  'Renonciation volontaire au regime de la marge sur cette vente (art. 297 C du CGI), a distinguer d''un bien qui n''y a jamais eu droit.';

-- Les lignes deja vendues portaient toutes la marge : le taux etait 20 %.
UPDATE public.vente_lignes
   SET taux_tva = 20
 WHERE type_taxe = 'tva_marge';

-- 3. Ce qu'un achat chez un grossiste coute vraiment --------------------------

ALTER TABLE public.achats_grossiste
  ADD COLUMN montant_total_ht NUMERIC DEFAULT 0,
  ADD COLUMN montant_tva NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.achats_grossiste.montant_total IS
  'Total toutes taxes comprises : ce qui sort de la caisse.';

-- Le total d'un achat se ventile desormais, puisque sa TVA se deduit.
CREATE OR REPLACE FUNCTION public.update_achat_grossiste_totaux()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_achat_id UUID;
BEGIN
  v_achat_id := COALESCE(NEW.achat_grossiste_id, OLD.achat_grossiste_id);
  IF v_achat_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  UPDATE public.achats_grossiste SET
    montant_total = COALESCE((
      SELECT SUM(COALESCE(prix_achat, 0) * COALESCE(quantite, 1))
      FROM public.bijoux_stock WHERE achat_grossiste_id = v_achat_id
    ), 0),
    montant_total_ht = COALESCE((
      SELECT SUM(COALESCE(prix_achat_ht, prix_achat, 0) * COALESCE(quantite, 1))
      FROM public.bijoux_stock WHERE achat_grossiste_id = v_achat_id
    ), 0),
    montant_tva = COALESCE((
      SELECT SUM(COALESCE(tva_achat_montant, 0) * COALESCE(quantite, 1))
      FROM public.bijoux_stock WHERE achat_grossiste_id = v_achat_id
    ), 0),
    montant_revente = COALESCE((
      SELECT SUM(COALESCE(prix_revente, 0) * COALESCE(quantite, 1))
      FROM public.bijoux_stock WHERE achat_grossiste_id = v_achat_id
    ), 0),
    updated_at = now()
  WHERE id = v_achat_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Les achats existants n'avaient pas de ventilation : leur prix saisi tient
-- lieu de HT tant que personne ne l'a repris.
UPDATE public.achats_grossiste a
   SET montant_total_ht = COALESCE((
         SELECT SUM(COALESCE(b.prix_achat, 0) * COALESCE(b.quantite, 1))
         FROM public.bijoux_stock b WHERE b.achat_grossiste_id = a.id
       ), 0),
       montant_tva = 0;
