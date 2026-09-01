-- ============================================================
-- Migration 139 : accueillir un telephone international et une adresse eclatee
--
-- Constats de recette (parcours 5, etape 3) :
--   « Pour le champ telephone j'aimerais que tu me mette un emoji drapeau en
--     liste pour choix du code et le masque corespondant »
--   « Pour le champ adresse on vas passer par l'API google autocomplete »
--
-- Telephone : la colonne plafonnait a 20 caracteres. Un numero au format
-- international, indicatif compris, peut depasser cette limite une fois mis en
-- forme. Le plafond passe a 32 — assez large pour tous les formats, assez
-- etroit pour rester une garde-fou.
--
-- Adresse : quatre colonnes seulement existaient (adresse, ville, code postal,
-- pays), sans place pour ce que renvoie un service d'autocompletion. Les
-- nouvelles colonnes sont toutes NULLABLE : une adresse saisie a la main reste
-- parfaitement valide, et c'est meme le mode de repli tant que la cle d'API
-- n'est pas en place.
-- ============================================================

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_phone_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_phone_check CHECK (char_length(phone) <= 32);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS street_number TEXT CHECK (char_length(street_number) <= 32),
  ADD COLUMN IF NOT EXISTS route TEXT CHECK (char_length(route) <= 255),
  ADD COLUMN IF NOT EXISTS formatted_address TEXT CHECK (char_length(formatted_address) <= 512),
  -- Identifiant du lieu chez le fournisseur d'autocompletion : permet de
  -- retrouver la fiche d'origine sans redemander l'adresse au client.
  ADD COLUMN IF NOT EXISTS place_id TEXT CHECK (char_length(place_id) <= 255),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

COMMENT ON COLUMN public.clients.formatted_address IS
  'Adresse complete telle que renvoyee par le service d''autocompletion. Les colonnes address / postal_code / city restent la source pour les documents.';
