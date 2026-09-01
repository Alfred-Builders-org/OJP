-- ============================================================
-- Migration 143 : registre des objets mobiliers (livre de police)
--
-- Obligation de l'article 321-7 du code penal : toute personne dont l'activite
-- comporte la vente ou l'echange d'objets mobiliers usages doit tenir un
-- registre journalier permettant d'identifier les vendeurs et de decrire les
-- objets. Son defaut de tenue, ou le refus de le presenter, est puni de six mois
-- d'emprisonnement et 30 000 EUR d'amende. C'est une obligation penale, pas
-- fiscale : elle ne se rattrape pas en fin d'exercice.
--
-- Les mentions sont celles de l'article R321-3 du code penal.
--
-- Le registre FIGE ses mentions a l'entree de l'objet. Une vue calculee aurait
-- suivi les corrections apportees ensuite a la fiche du client — un registre qui
-- se reecrit n'a aucune valeur probante.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.registre_objets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Numero d'ordre continu : c'est lui qui fait la valeur du registre. Une
  -- rupture de sequence se voit.
  numero_ordre BIGINT GENERATED ALWAYS AS IDENTITY,
  date_entree TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Identite du cedant (R321-3, 1°) ──
  cedant_nom TEXT NOT NULL,
  cedant_prenoms TEXT,
  cedant_qualite TEXT,
  cedant_domicile TEXT,
  -- Nature, numero et autorite de delivrance de la piece presentee.
  piece_nature TEXT,
  piece_numero TEXT,
  piece_autorite TEXT,
  piece_date_delivrance DATE,

  -- ── Objet (R321-3, 3°) ──
  objet_nature TEXT NOT NULL,
  objet_description TEXT,
  objet_provenance TEXT NOT NULL,
  objet_metal TEXT,
  objet_titrage TEXT,
  objet_poids NUMERIC(10,2),
  objet_quantite INTEGER DEFAULT 1,
  prix NUMERIC(12,2),

  -- ── Tracabilite interne ──
  reference TEXT,
  lot_reference_id UUID REFERENCES public.lot_references(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registre_objets_date_idx ON public.registre_objets(date_entree DESC);
CREATE INDEX IF NOT EXISTS registre_objets_ref_idx ON public.registre_objets(lot_reference_id);
CREATE INDEX IF NOT EXISTS registre_objets_cedant_idx ON public.registre_objets(cedant_nom);

ALTER TABLE public.registre_objets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registre_objets_select" ON public.registre_objets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Ni modification ni suppression : un registre ne se corrige pas, il s'annote.
-- L'insertion passe par le declencheur, en SECURITY DEFINER.
CREATE POLICY "registre_objets_insert" ON public.registre_objets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

/**
 * Inscrit un objet au registre des le moment ou il entre en possession de la
 * boutique — c'est-a-dire des la creation de la reference, sans attendre la
 * finalisation. Le registre est journalier : il doit refleter ce qui est
 * physiquement detenu, pas ce qui est deja contractualise.
 */
CREATE OR REPLACE FUNCTION public.inscrire_au_registre()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_piece RECORD;
  v_lot RECORD;
  v_provenance TEXT;
BEGIN
  SELECT l.id, l.type, l.numero, l.dossier_id INTO v_lot
  FROM public.lots l WHERE l.id = NEW.lot_id;

  IF v_lot IS NULL THEN
    RETURN NEW;
  END IF;

  -- Seules les entrees en provenance d'un particulier sont concernees : une
  -- vente est une sortie, elle n'a rien a faire au registre des entrees.
  IF v_lot.type NOT IN ('rachat', 'depot_vente') THEN
    RETURN NEW;
  END IF;

  SELECT c.* INTO v_client
  FROM public.clients c
  JOIN public.dossiers d ON d.client_id = c.id
  WHERE d.id = v_lot.dossier_id;

  IF v_client IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_piece
  FROM public.client_identity_documents
  WHERE client_id = v_client.id
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1;

  v_provenance := CASE v_lot.type
    WHEN 'rachat' THEN 'Achat a un particulier - lot ' || v_lot.numero
    WHEN 'depot_vente' THEN 'Depot-vente - lot ' || v_lot.numero
  END;

  INSERT INTO public.registre_objets (
    cedant_nom, cedant_prenoms, cedant_qualite, cedant_domicile,
    piece_nature, piece_numero, piece_autorite, piece_date_delivrance,
    objet_nature, objet_description, objet_provenance,
    objet_metal, objet_titrage, objet_poids, objet_quantite, prix,
    reference, lot_reference_id, client_id
  ) VALUES (
    v_client.last_name,
    v_client.first_name,
    CASE WHEN v_client.civility = 'M' THEN 'Monsieur' ELSE 'Madame' END,
    NULLIF(TRIM(CONCAT_WS(' ', v_client.address, v_client.postal_code, v_client.city)), ''),
    CASE v_piece.document_type
      WHEN 'cni' THEN 'Carte nationale d''identite'
      WHEN 'passeport' THEN 'Passeport'
      WHEN 'titre_sejour' THEN 'Titre de sejour'
      WHEN 'permis_conduire' THEN 'Permis de conduire'
      ELSE NULL
    END,
    v_piece.document_number,
    -- L'autorite de delivrance n'est pas saisie aujourd'hui : la colonne
    -- l'attend, la mention reste a completer.
    NULL,
    v_piece.issue_date,
    NEW.designation,
    NULLIF(TRIM(CONCAT_WS(' - ', NEW.metal, NEW.qualite,
      CASE WHEN NEW.poids_net IS NOT NULL THEN NEW.poids_net || ' g' ELSE NULL END)), ''),
    v_provenance,
    NEW.metal,
    NEW.qualite,
    COALESCE(NEW.poids_net, NEW.poids),
    COALESCE(NEW.quantite, 1),
    NEW.prix_achat,
    NEW.numero,
    NEW.id,
    v_client.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER inscrire_au_registre_trigger
  AFTER INSERT ON public.lot_references
  FOR EACH ROW EXECUTE FUNCTION public.inscrire_au_registre();

-- Reprise de l'existant : les objets deja entres doivent figurer au registre,
-- dans leur ordre d'arrivee. Sans cela, le registre commencerait a la date de
-- cette migration, ce qui se verrait immediatement lors d'un controle.
INSERT INTO public.registre_objets (
  date_entree,
  cedant_nom, cedant_prenoms, cedant_qualite, cedant_domicile,
  piece_nature, piece_numero, piece_date_delivrance,
  objet_nature, objet_description, objet_provenance,
  objet_metal, objet_titrage, objet_poids, objet_quantite, prix,
  reference, lot_reference_id, client_id
)
SELECT
  r.created_at,
  c.last_name,
  c.first_name,
  CASE WHEN c.civility = 'M' THEN 'Monsieur' ELSE 'Madame' END,
  NULLIF(TRIM(CONCAT_WS(' ', c.address, c.postal_code, c.city)), ''),
  CASE p.document_type
    WHEN 'cni' THEN 'Carte nationale d''identite'
    WHEN 'passeport' THEN 'Passeport'
    WHEN 'titre_sejour' THEN 'Titre de sejour'
    WHEN 'permis_conduire' THEN 'Permis de conduire'
    ELSE NULL
  END,
  p.document_number,
  p.issue_date,
  r.designation,
  NULLIF(TRIM(CONCAT_WS(' - ', r.metal, r.qualite,
    CASE WHEN r.poids_net IS NOT NULL THEN r.poids_net || ' g' ELSE NULL END)), ''),
  CASE l.type
    WHEN 'rachat' THEN 'Achat a un particulier - lot ' || l.numero
    WHEN 'depot_vente' THEN 'Depot-vente - lot ' || l.numero
    ELSE 'Lot ' || l.numero
  END,
  r.metal,
  r.qualite,
  COALESCE(r.poids_net, r.poids),
  COALESCE(r.quantite, 1),
  r.prix_achat,
  r.numero,
  r.id,
  c.id
FROM public.lot_references r
JOIN public.lots l ON l.id = r.lot_id
JOIN public.dossiers d ON d.id = l.dossier_id
JOIN public.clients c ON c.id = d.client_id
LEFT JOIN LATERAL (
  SELECT * FROM public.client_identity_documents
  WHERE client_id = c.id
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1
) p ON TRUE
WHERE l.type IN ('rachat', 'depot_vente')
  AND NOT EXISTS (
    SELECT 1 FROM public.registre_objets ro WHERE ro.lot_reference_id = r.id
  )
ORDER BY r.created_at;
