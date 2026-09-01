-- Le comptoir decide, vente par vente, s'il demande un acompte.
--
-- Jusqu'ici, la presence d'or d'investissement suffisait a declencher une
-- facture d'acompte et une facture de solde. Le client qui paie la totalite au
-- comptoir recevait donc deux pieces pour un seul versement, et la vente se
-- mettait a attendre un solde deja encaisse.
--
-- Le defaut vaut true : les ventes en cours gardent l'acompte qui leur a deja
-- ete facture, et rien de ce qui a ete emis ne change de lecture.

ALTER TABLE public.lots
  ADD COLUMN avec_acompte BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.lots.avec_acompte IS
  'Vente d''or d''investissement : true = facture d''acompte puis facture de solde, false = facture unique reglee en une fois. Sans effet sur les autres types de lot.';
