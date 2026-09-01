-- ============================================================
-- Migration 142 : matieres a prix fixe, titrage libre, coefficients par piece
--                 et numerotation des references
--
-- Quatre demandes qui touchent toutes a la facon dont un article est valorise
-- et designe.
-- ============================================================

-- ── 1. Matieres a prix fixe ──────────────────────────────────
-- Le plaque or, le plaque argent et les matieres non precieuses ne se valorisent
-- pas au cours d'un metal : elles ont un tarif au gramme, fixe, que la boutique
-- decide. Il n'y a donc rien a relever aupres d'une API — d'ou des colonnes de
-- parametres distinctes des trois cours.
ALTER TABLE public.parametres
  ADD COLUMN IF NOT EXISTS prix_plaque_or NUMERIC(10,4) NOT NULL DEFAULT 0.0700,
  ADD COLUMN IF NOT EXISTS prix_plaque_argent NUMERIC(10,4) NOT NULL DEFAULT 0.0100,
  ADD COLUMN IF NOT EXISTS prix_autre NUMERIC(10,4) NOT NULL DEFAULT 0.0100;

COMMENT ON COLUMN public.parametres.prix_plaque_or IS
  'Tarif fixe du plaque or, en euros par gramme. Saisi a la main, jamais releve.';

-- Le controle de vraisemblance des cours (migration 136) ne s'applique pas a ces
-- tarifs : ils ne suivent aucun marche, et un ecart de plus de 30 % y est une
-- decision commerciale, pas une faute de frappe.

-- ── 2. Les matieres a prix fixe deviennent choisissables ─────
-- « Autre » existait deja en stock ; le plaque entre a son tour, et les trois
-- deviennent disponibles au rachat comme au depot-vente.
ALTER TABLE public.lot_references DROP CONSTRAINT IF EXISTS lot_references_metal_check;
ALTER TABLE public.lot_references ADD CONSTRAINT lot_references_metal_check
  CHECK (metal IN ('Or', 'Argent', 'Platine', 'Plaque or', 'Plaque argent', 'Autre'));

ALTER TABLE public.bijoux_stock DROP CONSTRAINT IF EXISTS bijoux_stock_metaux_check;
ALTER TABLE public.bijoux_stock ADD CONSTRAINT bijoux_stock_metaux_check
  CHECK (metaux IN ('Or', 'Argent', 'Platine', 'Plaque or', 'Plaque argent', 'Autre'));

-- ── 3. Titrage libre ─────────────────────────────────────────
-- Le titrage etait contraint a cinq valeurs (333, 375, 585, 750, 999), ce qui
-- laissait de cote les titrages reellement rencontres — 800 et 925 pour
-- l'argent, 950 pour le platine. Il devient un millieme libre entre 0 et 1000.
ALTER TABLE public.lot_references DROP CONSTRAINT IF EXISTS lot_references_qualite_check;
ALTER TABLE public.lot_references ADD CONSTRAINT lot_references_qualite_check
  CHECK (qualite IS NULL OR (qualite ~ '^[0-9]{1,4}$' AND qualite::INT BETWEEN 0 AND 1000));

ALTER TABLE public.bijoux_stock DROP CONSTRAINT IF EXISTS bijoux_stock_qualite_check;
ALTER TABLE public.bijoux_stock ADD CONSTRAINT bijoux_stock_qualite_check
  CHECK (qualite IS NULL OR (qualite ~ '^[0-9]{1,4}$' AND qualite::INT BETWEEN 0 AND 1000));

-- ── 4. Coefficients propres a chaque piece d'investissement ──
-- Une piece ne se negocie pas au meme coefficient qu'une autre : un napoleon et
-- un lingot n'ont ni la meme prime ni la meme liquidite. NULL signifie « suivre
-- le coefficient general » : rien ne change pour les pieces deja saisies.
ALTER TABLE public.or_investissement
  ADD COLUMN IF NOT EXISTS coefficient_achat NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS coefficient_vente NUMERIC(6,4);

COMMENT ON COLUMN public.or_investissement.coefficient_achat IS
  'Coefficient applique au cours pour cette piece. NULL : suivre le coefficient general des parametres.';

-- ── 5. Numerotation des references ───────────────────────────
-- Une reference se designe par « numero du lot / rang », ex. RAC-2026-0004/002.
-- Sans elle, deux bagues du meme lot n'avaient aucun moyen d'etre distinguees
-- sur un document ou en rayon.
ALTER TABLE public.lot_references
  ADD COLUMN IF NOT EXISTS numero TEXT;

CREATE OR REPLACE FUNCTION public.generate_lot_reference_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lot_numero TEXT;
  v_seq INT;
BEGIN
  -- Le verrou porte sur le lot : deux references creees en parallele dans le
  -- meme lot ne doivent pas recevoir le meme rang.
  PERFORM pg_advisory_xact_lock(hashtext('lot_reference_numero' || NEW.lot_id::TEXT));

  SELECT numero INTO v_lot_numero FROM public.lots WHERE id = NEW.lot_id;
  IF v_lot_numero IS NULL OR v_lot_numero = '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(
    CASE WHEN numero ~ ('^' || regexp_replace(v_lot_numero, '([^a-zA-Z0-9])', E'\\\\\\1', 'g') || '/\d+$')
    THEN CAST(SUBSTRING(numero FROM '\d+$') AS INT)
    ELSE 0 END
  ), 0) + 1
  INTO v_seq
  FROM public.lot_references
  WHERE lot_id = NEW.lot_id;

  NEW.numero := v_lot_numero || '/' || LPAD(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_lot_reference_numero_trigger
  BEFORE INSERT ON public.lot_references
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_lot_reference_numero();

-- Les references deja en base recoivent leur numero, dans leur ordre de
-- creation : la reference imprimee sur un document passe doit rester la meme.
WITH numerotees AS (
  SELECT r.id,
         l.numero || '/' || LPAD(
           ROW_NUMBER() OVER (PARTITION BY r.lot_id ORDER BY r.created_at, r.id)::TEXT,
           3, '0') AS numero
  FROM public.lot_references r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.numero IS NULL AND l.numero IS NOT NULL AND l.numero <> ''
)
UPDATE public.lot_references r
SET numero = n.numero
FROM numerotees n
WHERE r.id = n.id;

CREATE INDEX IF NOT EXISTS lot_references_numero_idx ON public.lot_references(numero);

-- Un article en stock porte la reference de l'article dont il provient : c'est
-- ce qui permet de le retrouver depuis le rayon jusqu'au contrat d'origine.
ALTER TABLE public.bijoux_stock
  ADD COLUMN IF NOT EXISTS reference TEXT;

UPDATE public.bijoux_stock b
SET reference = r.numero
FROM public.lot_references r
WHERE r.destination_stock_id = b.id
  AND b.reference IS NULL
  AND r.numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS bijoux_stock_reference_idx ON public.bijoux_stock(reference);
