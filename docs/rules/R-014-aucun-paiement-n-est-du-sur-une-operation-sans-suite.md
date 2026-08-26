---
id: R-014
title: Aucun paiement n'est dû sur une opération sans suite
statement: Un règlement sortant de type rachat est refusé par la base dès lors que le lot porte l'issue « rétracté », « refusé » ou « annulé », quel que soit le chemin de saisie ; les mouvements entrants restent permis, précisément pour le remboursement.
enforcement: constraint
surface: paiements
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
source_feature: F-013
---

## Où elle est tenue

`supabase/migrations/135_*.sql`, fonction `bloquer_reglement_operation_sans_suite`, déclenchée avant toute écriture dans `reglements`.

## Pourquoi

Constat de recette du 13 août : le lot RAC-2026-0010 portait à la fois l'issue « rétracté » et un règlement au client. Une rétractation avait été enregistrée, puis le client payé malgré tout, sans que rien ne s'y oppose. Même situation possible sur un devis refusé, constatée sur RAC-2026-0013.

Un lot rétracté ou refusé est marqué « finalisé » comme un lot mené à terme : seule l'issue les distingue. La vérification côté interface ne suffisait pas, les deux règlements fautifs ayant été saisis hors du parcours de paiement.

La portée est volontairement étroite : seul le versement au client est bloqué. Un mouvement entrant reste permis, et c'est précisément ce qui se passe au remboursement (voir [R-015](R-015-un-remboursement-s-enregistre-comme-un-reglement-negatif.md)).
