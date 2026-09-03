-- ============================================================
-- Migration 156 : reparer un bijou qui n'est pas en stock
--
-- `reparations.bijou_id` etait NOT NULL vers `bijoux_stock` : seule une piece
-- de l'inventaire pouvait partir en reparation. Or l'essentiel des reparations
-- de la boutique porte sur des bijoux APPORTES par des clients, qui n'entrent
-- jamais en stock — ils sont deposes, repares, rendus. La feuille de caisse
-- tenue a la main en temoigne : « reparation 249 », « rep GUELLEL », une
-- colonne entiere que l'application ne savait pas produire.
--
-- Le bijou devient donc facultatif, et deux descriptions le remplacent quand il
-- manque : a qui appartient l'objet, et ce que c'est. Le prix facture au client
-- rejoint la ligne — c'est lui qui entre en caisse, pas le cout de l'atelier.
-- ============================================================

ALTER TABLE public.reparations ALTER COLUMN bijou_id DROP NOT NULL;

ALTER TABLE public.reparations
  ADD COLUMN IF NOT EXISTS client_id UUID
    REFERENCES public.clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS prix_facture NUMERIC(10,2);

COMMENT ON COLUMN public.reparations.client_id IS
  'Proprietaire du bijou apporte. Renseigne quand la reparation ne porte pas sur le stock.';
COMMENT ON COLUMN public.reparations.designation IS
  'Ce qui est repare, quand l''objet n''a pas de fiche en stock.';
COMMENT ON COLUMN public.reparations.prix_facture IS
  'Prix demande au client. Distinct de cout_reel, qui est ce que l''atelier facture a la boutique.';

-- Une reparation porte sur un bijou du stock, ou sur un objet decrit et son
-- proprietaire. Jamais sur rien : sans l'un ni l'autre, la ligne ne designe
-- aucun objet et la caisse ne saurait pas de quoi elle parle.
ALTER TABLE public.reparations
  DROP CONSTRAINT IF EXISTS reparations_objet_identifie;
ALTER TABLE public.reparations
  ADD CONSTRAINT reparations_objet_identifie
  CHECK (
    bijou_id IS NOT NULL
    OR (client_id IS NOT NULL AND designation IS NOT NULL AND designation <> '')
  );

CREATE INDEX IF NOT EXISTS reparations_client_idx
  ON public.reparations(client_id) WHERE client_id IS NOT NULL;

-- L'index unique « un seul envoi actif par bijou » ne portait que sur bijou_id.
-- Il reste juste : NULL n'entre pas dans un index unique, donc plusieurs
-- reparations hors stock coexistent sans se gener.
