-- ============================================================
-- Migration 155 : un reglement n'exige plus un lot
--
-- `reglements.lot_id` etait NOT NULL. Un encaissement ne pouvait donc exister
-- qu'adosse a un rachat, une vente ou un depot-vente. Deux mouvements d'argent
-- reels du comptoir restaient dehors :
--
--   - la reparation, payee par le client qui vient rechercher son bijou ;
--   - l'achat chez un grossiste, paye au fournisseur.
--
-- Les deux figurent dans la feuille de caisse que la boutique tient a la main —
-- les reparations y occupent une colonne entiere — et aucune ne pouvait entrer
-- dans l'application. La feuille de caisse du jour aurait donc affiche des
-- totaux faux tant que ce verrou tenait.
--
-- Le rattachement reste obligatoire : un reglement pend toujours a quelque
-- chose. La migration 145 avait deja ouvert la porte en rendant `lot_id`
-- nullable pour les reglements de fonderie portes par un envoi ; on elargit la
-- meme liste plutot que d'en inventer une seconde.
-- ============================================================

-- ── 1. Deux rattachements de plus ────────────────────────────
-- `lot_id` est nullable depuis la migration 145 ; la ligne ci-dessous ne fait
-- que rendre l'etat explicite pour qui lit cette migration seule.
ALTER TABLE public.reglements ALTER COLUMN lot_id DROP NOT NULL;

ALTER TABLE public.reglements
  ADD COLUMN IF NOT EXISTS reparation_id UUID
    REFERENCES public.reparations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS achat_grossiste_id UUID
    REFERENCES public.achats_grossiste(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.reglements.reparation_id IS
  'Reparation payee par le client. L''un des rattachements possibles d''un reglement.';
COMMENT ON COLUMN public.reglements.achat_grossiste_id IS
  'Achat fournisseur regle. L''un des rattachements possibles d''un reglement.';

-- Au moins un rattachement, comme depuis la migration 145 : un reglement qui ne
-- pend a rien ne se rapproche d'aucune operation et fausse la caisse. On ne
-- verrouille pas l'exclusivite — le modele en place l'admet deja, un reglement
-- de fonderie pouvant porter a la fois son bon de commande et son bon de
-- livraison.
ALTER TABLE public.reglements DROP CONSTRAINT IF EXISTS reglements_rattachement_check;
ALTER TABLE public.reglements ADD CONSTRAINT reglements_rattachement_check
  CHECK (
    lot_id IS NOT NULL
    OR bon_commande_id IS NOT NULL
    OR bon_livraison_id IS NOT NULL
    OR reparation_id IS NOT NULL
    OR achat_grossiste_id IS NOT NULL
  );

-- ── 2. Deux natures de mouvement de plus ─────────────────────
ALTER TABLE public.reglements DROP CONSTRAINT IF EXISTS reglements_type_check;
ALTER TABLE public.reglements ADD CONSTRAINT reglements_type_check
  CHECK (type IN ('rachat','vente','acompte','solde','fonderie','depot_vente',
                  'reparation','achat_grossiste'));

-- ── 3. La caisse interroge par jour ──────────────────────────
CREATE INDEX IF NOT EXISTS reglements_date_idx
  ON public.reglements(date_reglement DESC);
CREATE INDEX IF NOT EXISTS reglements_reparation_idx
  ON public.reglements(reparation_id) WHERE reparation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reglements_achat_grossiste_idx
  ON public.reglements(achat_grossiste_id) WHERE achat_grossiste_id IS NOT NULL;

-- ── 4. Les declencheurs qui supposaient un lot ───────────────
--
-- Les deux corps ci-dessous sont ceux des migrations 045 et 135, a une garde
-- pres. Le reste est reproduit a l'identique : ces declencheurs tiennent les
-- colonnes de paiement des lots en production, et le chemin rapide d'INSERT de
-- 045 n'ecrit pas les memes colonnes que son chemin de recalcul — les unifier
-- aurait change le comportement sans que rien ne le signale.

-- `sync_reglement_to_lot` reporte le reglement sur les colonnes historiques du
-- lot. Un reglement de reparation ou d'achat grossiste n'en a aucun a mettre a
-- jour : il sortait jusqu'ici sur un identifiant nul et ne touchait aucune
-- ligne par chance plutot que par decision.
CREATE OR REPLACE FUNCTION public.sync_reglement_to_lot()
RETURNS TRIGGER AS $$
DECLARE
  v_lot_id UUID;
  v_has_acompte BOOLEAN;
  v_has_solde BOOLEAN;
  v_last_reg RECORD;
BEGIN
  -- Determine which lot to update
  v_lot_id := COALESCE(NEW.lot_id, OLD.lot_id);

  -- Reglement hors lot : rien a reporter.
  IF v_lot_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Original INSERT logic (fast path)
    IF NEW.type = 'acompte' THEN
      UPDATE public.lots SET
        acompte_paye = true,
        date_acompte = NEW.date_reglement,
        mode_reglement = NEW.mode
      WHERE id = NEW.lot_id;
    ELSIF NEW.type = 'solde' THEN
      UPDATE public.lots SET
        solde_paye = true,
        date_solde = NEW.date_reglement,
        mode_reglement = NEW.mode,
        date_reglement = NEW.date_reglement
      WHERE id = NEW.lot_id;
    ELSIF NEW.type IN ('vente', 'rachat') THEN
      UPDATE public.lots SET
        mode_reglement = NEW.mode,
        date_reglement = NEW.date_reglement
      WHERE id = NEW.lot_id;
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE and UPDATE: re-evaluate from scratch
  SELECT EXISTS(
    SELECT 1 FROM public.reglements WHERE lot_id = v_lot_id AND type = 'acompte'
  ) INTO v_has_acompte;

  SELECT EXISTS(
    SELECT 1 FROM public.reglements WHERE lot_id = v_lot_id AND type = 'solde'
  ) INTO v_has_solde;

  SELECT mode, date_reglement, type
  INTO v_last_reg
  FROM public.reglements
  WHERE lot_id = v_lot_id
  ORDER BY date_reglement DESC, created_at DESC
  LIMIT 1;

  UPDATE public.lots SET
    acompte_paye = v_has_acompte,
    date_acompte = (SELECT MAX(date_reglement) FROM public.reglements WHERE lot_id = v_lot_id AND type = 'acompte'),
    solde_paye = v_has_solde,
    date_solde = (SELECT MAX(date_reglement) FROM public.reglements WHERE lot_id = v_lot_id AND type = 'solde'),
    mode_reglement = v_last_reg.mode,
    date_reglement = v_last_reg.date_reglement
  WHERE id = v_lot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- `bloquer_reglement_operation_sans_suite` interdit de payer un client sur un
-- lot retracte ou refuse (migration 135). Le filtre sur sens/type le protegeait
-- deja d'un reglement sans lot ; la garde explicite evite qu'un futur type de
-- mouvement sortant le contourne par surprise.
CREATE OR REPLACE FUNCTION public.bloquer_reglement_operation_sans_suite()
RETURNS TRIGGER AS $$
DECLARE
  v_outcome TEXT;
  v_numero TEXT;
BEGIN
  IF NEW.lot_id IS NULL THEN
    RETURN NEW;
  END IF;

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
