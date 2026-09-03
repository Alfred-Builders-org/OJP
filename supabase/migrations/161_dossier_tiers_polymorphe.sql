-- ============================================================
-- Migration 161 : un dossier peut porter un particulier, un grossiste ou une
--                 fonderie
--
-- Jusqu'ici, un dossier tenait forcement a un client particulier
-- (`client_id NOT NULL`). Or la boutique achete aussi de l'or a des grossistes
-- et a des fonderies, et envoie fondre chez ces dernieres : autant d'operations
-- qui meritent la meme mecanique dossier -> lot -> references, mais avec un
-- fournisseur en face plutot qu'un particulier.
--
-- On ouvre donc le tiers du dossier a trois formes, sans casser l'existant :
-- toutes les lignes actuelles sont des dossiers de particulier.
-- ============================================================

-- ── Le tiers devient polymorphe ──────────────────────────────
ALTER TABLE public.dossiers ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.dossiers
  ADD COLUMN IF NOT EXISTS grossiste_id UUID REFERENCES public.grossistes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS fonderie_id UUID REFERENCES public.fonderies(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS tiers_type TEXT;

-- L'existant est entierement du particulier.
UPDATE public.dossiers SET tiers_type = 'client' WHERE tiers_type IS NULL;

ALTER TABLE public.dossiers ALTER COLUMN tiers_type SET DEFAULT 'client';
ALTER TABLE public.dossiers ALTER COLUMN tiers_type SET NOT NULL;

ALTER TABLE public.dossiers DROP CONSTRAINT IF EXISTS dossiers_tiers_type_check;
ALTER TABLE public.dossiers ADD CONSTRAINT dossiers_tiers_type_check
  CHECK (tiers_type IN ('client', 'grossiste', 'fonderie'));

-- Un tiers, et un seul, coherent avec son type.
ALTER TABLE public.dossiers DROP CONSTRAINT IF EXISTS dossiers_un_seul_tiers;
ALTER TABLE public.dossiers ADD CONSTRAINT dossiers_un_seul_tiers
  CHECK (
    (tiers_type = 'client'    AND client_id IS NOT NULL AND grossiste_id IS NULL AND fonderie_id IS NULL)
    OR (tiers_type = 'grossiste' AND grossiste_id IS NOT NULL AND client_id IS NULL AND fonderie_id IS NULL)
    OR (tiers_type = 'fonderie'  AND fonderie_id IS NOT NULL AND client_id IS NULL AND grossiste_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS dossiers_grossiste_id_idx ON public.dossiers(grossiste_id) WHERE grossiste_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS dossiers_fonderie_id_idx ON public.dossiers(fonderie_id) WHERE fonderie_id IS NOT NULL;

COMMENT ON COLUMN public.dossiers.tiers_type IS
  'Nature du tiers du dossier : client (particulier), grossiste ou fonderie.';

-- ── La numerotation lit le bon tiers ─────────────────────────
-- Le nom qui entre dans le numero vient du client, du grossiste ou de la
-- fonderie selon le cas. Le reste du format est inchange.
CREATE OR REPLACE FUNCTION public.generate_dossier_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_tiers_name TEXT;
  v_date_prefix TEXT;
  v_seq INT;
BEGIN
  IF NEW.tiers_type = 'grossiste' THEN
    SELECT UPPER(REPLACE(nom, ' ', '')) INTO v_tiers_name
    FROM public.grossistes WHERE id = NEW.grossiste_id;
  ELSIF NEW.tiers_type = 'fonderie' THEN
    SELECT UPPER(REPLACE(nom, ' ', '')) INTO v_tiers_name
    FROM public.fonderies WHERE id = NEW.fonderie_id;
  ELSE
    SELECT UPPER(REPLACE(last_name, ' ', '')) INTO v_tiers_name
    FROM public.clients WHERE id = NEW.client_id;
  END IF;

  v_tiers_name := COALESCE(NULLIF(v_tiers_name, ''), 'TIERS');

  v_date_prefix := 'DOS' || to_char(now(), 'DD-MM-YYYY');

  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.dossiers
  WHERE numero LIKE v_date_prefix || '-' || v_tiers_name || '-%';

  NEW.numero := v_date_prefix || '-' || v_tiers_name || '-' || LPAD(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
