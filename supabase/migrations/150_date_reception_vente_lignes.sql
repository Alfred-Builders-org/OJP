-- ============================================================
-- Migration 150 : dater la reception d'un article vendu
--
-- Un article d'or d'investissement passait directement de « servi » ou
-- « commande » a « livre au client ». Il manquait l'etape du milieu, celle qui
-- se joue vraiment au comptoir : la marchandise est arrivee, on la met de cote,
-- et le client vient la chercher plus tard — parfois le lendemain.
--
-- Le statut `recu` existait deja dans `fulfillment`, mais seule la reception
-- d'un bon de commande fonderie le posait. Il devient une etape a part entiere,
-- et on retient sa date : entre la reception et la remise, c'est la boutique qui
-- detient le bien, et savoir depuis quand n'est pas un detail.
-- ============================================================

ALTER TABLE public.vente_lignes
  ADD COLUMN IF NOT EXISTS date_reception TIMESTAMPTZ;

COMMENT ON COLUMN public.vente_lignes.date_reception IS
  'Moment ou l''article est entre en boutique, avant sa remise au client.';

-- Les lignes deja recues sans date connue : on retient leur derniere mise a
-- jour, faute de mieux, plutot que de laisser un vide qui se lirait comme
-- « jamais recu ».
UPDATE public.vente_lignes
SET date_reception = updated_at
WHERE fulfillment = 'recu' AND date_reception IS NULL;
