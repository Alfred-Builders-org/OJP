---
id: R-013
title: Un lot dont le devis est parti ne change plus de contenu
statement: Aucune référence ne peut être ajoutée ni supprimée sur un lot dont le statut n'est plus « brouillon ».
enforcement: constraint
surface: cycle-de-vie
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-008
---

## Où elle est tenue

La garde a été posée au commit `c18906c`, et s'applique à l'ajout comme à la suppression de références.

## Pourquoi

Un devis engage la maison sur un prix ferme, calculé à partir des références présentes au moment de son émission. Ajouter une ligne après coup produirait un total qui ne correspond plus au document remis au client.

Modifier le contenu d'un lot suppose donc de repartir d'un brouillon.
