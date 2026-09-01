-- ============================================================
-- Migration 144 : le cours que la fonderie a reellement retenu
--
-- Au retour d'un envoi, la valeur reelle etait deduite du cours estime au
-- depart, corrige du titrage constate. Ce calcul suppose que la fonderie paie
-- au meme cours que celui du jour de l'envoi — ce qui n'arrive presque jamais :
-- elle applique le cours de sa propre date de traitement, et parfois une
-- decote. Le montant affiche divergeait donc du reglement recu, sans que rien
-- ne dise pourquoi.
--
-- `cours_reel` porte le cours au gramme annonce par la fonderie. Quand il est
-- renseigne, c'est lui qui fait foi pour la valeur reelle.
--
-- `valeur_reelle` devient saisissable a la main. C'est le seul montant qui
-- engage la boutique : un bordereau de fonderie donne parfois un total sans
-- detail exploitable, et il faut pouvoir le reprendre tel quel plutot que de
-- bricoler un titrage pour retomber sur le bon chiffre.
-- ============================================================

ALTER TABLE public.bon_livraison_lignes
  ADD COLUMN IF NOT EXISTS cours_reel NUMERIC;

COMMENT ON COLUMN public.bon_livraison_lignes.cours_reel IS
  'Cours au gramme retenu par la fonderie a son traitement. Prime sur cours_utilise pour le calcul de valeur_reelle.';

COMMENT ON COLUMN public.bon_livraison_lignes.valeur_reelle IS
  'Montant reellement paye par la fonderie. Calcule depuis le poids et le cours retenu, ou saisi a la main d''apres le bordereau.';
