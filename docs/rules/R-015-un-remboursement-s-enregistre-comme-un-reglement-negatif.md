---
id: R-015
title: Un remboursement s'enregistre comme un règlement négatif
statement: La somme rendue par un client qui se rétracte est enregistrée comme un règlement de rachat, de sens sortant et de montant négatif, rattaché à un reçu de remboursement : la somme des règlements du lot retombe ainsi à zéro sans qu'aucun calcul ait à distinguer les sens.
enforcement: constraint
surface: paiements
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
source_feature: F-012
---

## Où elle est tenue

`supabase/migrations/133_*.sql`, qui ajoute le type de document `remboursement_retractation` et son préfixe de numérotation.

## Pourquoi

En boutique, le client repart le plus souvent avec son argent le jour même : le règlement d'un rachat est donc possible pendant le délai légal. S'il se rétracte ensuite, la somme rendue doit laisser une trace comptable.

L'enregistrer comme un montant négatif du même type fait retomber la somme des règlements du lot à zéro, sans qu'aucun calcul de solde existant ait à distinguer les sens. Un type de mouvement distinct aurait obligé à reprendre tous ces calculs.
