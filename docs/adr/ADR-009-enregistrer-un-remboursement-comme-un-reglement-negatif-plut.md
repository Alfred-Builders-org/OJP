---
id: ADR-009
title: Enregistrer un remboursement comme un règlement négatif plutôt que comme un type à part
status: accepted
---

## Contexte

Le règlement d'un rachat est possible pendant le délai de rétractation, parce qu'en boutique le client repart le plus souvent avec son argent le jour même. S'il se rétracte ensuite, la somme rendue doit laisser une trace comptable.

## Décision

Le remboursement est un règlement de rachat, de sens sortant et de montant négatif, rattaché à un reçu de remboursement dédié.

## Conséquences

La somme des règlements du lot retombe naturellement à zéro, sans qu'aucun calcul existant ait à distinguer les sens. Un nouveau type de document et son préfixe de numérotation ont été ajoutés.

## Alternatives

Un type de mouvement distinct aurait obligé à reprendre tous les calculs de solde existants pour qu'ils en tiennent compte.
