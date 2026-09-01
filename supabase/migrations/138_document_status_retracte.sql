-- ============================================================
-- Migration 138 : un contrat retracte se lit comme tel
--
-- Constat de recette (parcours 10, etape 2) : « j'aimerais que le statut du
-- document contre un rachat soit marque comme retracte ».
--
-- Le contrat passait jusqu'ici en 'annule', statut deja porte par les confies
-- d'achat restitues. Les deux situations n'ont pourtant rien a voir : une
-- annulation est une decision de la boutique, une retractation est un droit
-- exerce par le client, avec ses propres consequences (reversement de la somme
-- percue, marchandise rendue). Les distinguer evite de relire le lot pour savoir
-- ce qui s'est passe.
-- ============================================================

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE public.documents ADD CONSTRAINT documents_status_check
  CHECK (status IN (
    'en_attente', 'accepte', 'refuse', 'signe', 'regle', 'emis', 'annule',
    'retracte'
  ));
