-- Grossistes : les professionnels chez qui on achete des bijoux neufs.
-- A distinguer des fonderies (a qui on achete de l'or d'investissement et a qui
-- on revend le metal fondu) et des clients (les particuliers).
CREATE TABLE public.grossistes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  raison_sociale TEXT,
  siret TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.grossistes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grossistes_select" ON public.grossistes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "grossistes_insert" ON public.grossistes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "grossistes_update" ON public.grossistes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "grossistes_delete" ON public.grossistes FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER grossistes_updated_at
  BEFORE UPDATE ON public.grossistes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Un achat chez un grossiste : une livraison de bijoux neufs, a une date, pour
-- un montant. Les articles achetes entrent directement en stock boutique.
CREATE TABLE public.achats_grossiste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE DEFAULT '',
  grossiste_id UUID NOT NULL REFERENCES public.grossistes(id) ON DELETE RESTRICT,
  date_achat DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_facture TEXT,
  montant_total NUMERIC DEFAULT 0,
  montant_revente NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX achats_grossiste_grossiste_idx ON public.achats_grossiste(grossiste_id);
CREATE INDEX achats_grossiste_date_idx ON public.achats_grossiste(date_achat DESC);

ALTER TABLE public.achats_grossiste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achats_grossiste_select" ON public.achats_grossiste FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "achats_grossiste_insert" ON public.achats_grossiste FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "achats_grossiste_update" ON public.achats_grossiste FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "achats_grossiste_delete" ON public.achats_grossiste FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER achats_grossiste_updated_at
  BEFORE UPDATE ON public.achats_grossiste
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Numerotation ACH-AAAA-NNNN, sur le meme modele que les lots.
CREATE OR REPLACE FUNCTION public.generate_achat_grossiste_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('achat_grossiste_numero'));

  v_year := EXTRACT(YEAR FROM COALESCE(NEW.date_achat, CURRENT_DATE))::TEXT;

  SELECT COALESCE(MAX(
    CASE WHEN numero ~ ('^ACH-' || v_year || '-\d+$')
    THEN CAST(SUBSTRING(numero FROM '\d+$') AS INT)
    ELSE 0 END
  ), 0) + 1
  INTO v_seq
  FROM public.achats_grossiste;

  NEW.numero := 'ACH-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_achat_grossiste_numero_trigger
  BEFORE INSERT ON public.achats_grossiste
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_achat_grossiste_numero();

-- Un bijou en stock peut venir d'un grossiste plutot que d'un rachat.
-- reference_fournisseur porte la reference du grossiste, celle de son catalogue.
ALTER TABLE public.bijoux_stock
  ADD COLUMN grossiste_id UUID REFERENCES public.grossistes(id) ON DELETE SET NULL,
  ADD COLUMN achat_grossiste_id UUID REFERENCES public.achats_grossiste(id) ON DELETE SET NULL,
  ADD COLUMN reference_fournisseur TEXT;

CREATE INDEX bijoux_stock_grossiste_idx ON public.bijoux_stock(grossiste_id);
CREATE INDEX bijoux_stock_achat_grossiste_idx ON public.bijoux_stock(achat_grossiste_id);

-- Les totaux d'un achat se deduisent de ses articles, comme pour un lot.
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

CREATE TRIGGER update_achat_grossiste_totaux_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bijoux_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_achat_grossiste_totaux();

-- Un bijou fantaisie n'est fait d'aucun metal precieux : il lui faut une valeur
-- propre, pour ne pas confondre "non precieux" avec "pas encore renseigne".
ALTER TABLE public.lot_references DROP CONSTRAINT IF EXISTS lot_references_metal_check;
ALTER TABLE public.lot_references ADD CONSTRAINT lot_references_metal_check
  CHECK (metal = ANY (ARRAY['Or'::text, 'Argent'::text, 'Platine'::text, 'Autre'::text]));

ALTER TABLE public.bijoux_stock DROP CONSTRAINT IF EXISTS bijoux_stock_metaux_check;
ALTER TABLE public.bijoux_stock ADD CONSTRAINT bijoux_stock_metaux_check
  CHECK (metaux = ANY (ARRAY['Or'::text, 'Platine'::text, 'Argent'::text, 'Autre'::text]));
