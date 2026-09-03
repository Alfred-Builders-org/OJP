-- ============================================================
-- Migration 162 : le livre de police accueille l'achat a un professionnel
--
-- Le registre des objets mobiliers (art. R321-3) n'inscrivait que les achats a
-- un particulier : le declencheur jointait `clients` et exigeait une piece
-- d'identite. Un rachat a un grossiste ou a une fonderie doit y figurer aussi —
-- decision de l'operateur — mais sans piece : c'est un professionnel, on retient
-- sa raison sociale, pas une CNI.
--
-- La fonte (lot de type 'fonte', migration 163) reste hors registre : c'est une
-- sortie, pas une entree. Le filtre sur le type de lot ne change pas.
-- ============================================================

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
  v_dossier RECORD;
  v_provenance TEXT;
  v_cedant_nom TEXT;
  v_cedant_prenoms TEXT;
  v_cedant_qualite TEXT;
  v_cedant_domicile TEXT;
  v_piece_nature TEXT;
  v_piece_numero TEXT;
  v_piece_date DATE;
  v_client_id UUID;
BEGIN
  SELECT l.id, l.type, l.numero, l.dossier_id INTO v_lot
  FROM public.lots l WHERE l.id = NEW.lot_id;

  IF v_lot IS NULL THEN
    RETURN NEW;
  END IF;

  -- Seules les entrees sont concernees ; une vente ou une fonte est une sortie.
  IF v_lot.type NOT IN ('rachat', 'depot_vente') THEN
    RETURN NEW;
  END IF;

  SELECT d.tiers_type, d.client_id, d.grossiste_id, d.fonderie_id, d.numero
  INTO v_dossier
  FROM public.dossiers d WHERE d.id = v_lot.dossier_id;

  IF v_dossier IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_dossier.tiers_type = 'client' THEN
    SELECT c.* INTO v_client FROM public.clients c WHERE c.id = v_dossier.client_id;
    IF v_client IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT * INTO v_piece
    FROM public.client_identity_documents
    WHERE client_id = v_client.id
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;

    v_cedant_nom := v_client.last_name;
    v_cedant_prenoms := v_client.first_name;
    v_cedant_qualite := CASE WHEN v_client.civility = 'M' THEN 'Monsieur' ELSE 'Madame' END;
    v_cedant_domicile := NULLIF(TRIM(CONCAT_WS(' ', v_client.address, v_client.postal_code, v_client.city)), '');
    v_piece_nature := CASE v_piece.document_type
      WHEN 'cni' THEN 'Carte nationale d''identite'
      WHEN 'passeport' THEN 'Passeport'
      WHEN 'titre_sejour' THEN 'Titre de sejour'
      WHEN 'permis_conduire' THEN 'Permis de conduire'
      ELSE NULL
    END;
    v_piece_numero := v_piece.document_number;
    v_piece_date := v_piece.issue_date;
    v_client_id := v_client.id;
    v_provenance := CASE v_lot.type
      WHEN 'rachat' THEN 'Achat a un particulier - lot ' || v_lot.numero
      WHEN 'depot_vente' THEN 'Depot-vente - lot ' || v_lot.numero
    END;
  ELSE
    -- Fournisseur : raison sociale, pas de piece.
    IF v_dossier.tiers_type = 'grossiste' THEN
      SELECT COALESCE(raison_sociale, nom) INTO v_cedant_nom
      FROM public.grossistes WHERE id = v_dossier.grossiste_id;
    ELSE
      SELECT nom INTO v_cedant_nom
      FROM public.fonderies WHERE id = v_dossier.fonderie_id;
    END IF;

    v_cedant_prenoms := NULL;
    v_cedant_qualite := 'Professionnel';
    v_cedant_domicile := NULL;
    v_piece_nature := NULL;
    v_piece_numero := NULL;
    v_piece_date := NULL;
    v_client_id := NULL;
    v_provenance := 'Achat a un professionnel - lot ' || v_lot.numero;
  END IF;

  INSERT INTO public.registre_objets (
    cedant_nom, cedant_prenoms, cedant_qualite, cedant_domicile,
    piece_nature, piece_numero, piece_autorite, piece_date_delivrance,
    objet_nature, objet_description, objet_provenance,
    objet_metal, objet_titrage, objet_poids, objet_quantite, prix,
    reference, lot_reference_id, client_id
  ) VALUES (
    v_cedant_nom,
    v_cedant_prenoms,
    v_cedant_qualite,
    v_cedant_domicile,
    v_piece_nature,
    v_piece_numero,
    NULL,
    v_piece_date,
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
    v_client_id
  );

  RETURN NEW;
END;
$$;
