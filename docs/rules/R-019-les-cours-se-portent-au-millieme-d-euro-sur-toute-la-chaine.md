---
id: R-019
title: Les cours se portent au millième d'euro sur toute la chaîne de calcul
statement: Les cours au gramme sont stockés avec trois décimales des paramètres jusqu'aux lignes de bon de livraison, en passant par les instantanés du lot et des références : arrondir au centime représenterait 0,25 % d'erreur sur l'argent.
enforcement: constraint
surface: cours
priority: 1
d025_class: format_validation
status: active
risk: risquee
source_feature: F-042
---

## Où elle est tenue

`supabase/migrations/130_*.sql`, qui élargit l'échelle sur toute la chaîne :

```
parametres.prix_*  ->  lots.cours_*_snapshot  ->  lot_references.cours_metal_utilise
                   ->  bon_livraison_lignes.cours_utilise
```

## Pourquoi

Les cours étaient stockés au centime alors que le formulaire acceptait déjà trois décimales. L'écart est négligeable sur l'or (113,357 devient 113,36) mais significatif sur l'argent, dont le cours au gramme avoisine 1,644 euro : arrondir au centime représente environ 0,25 % d'erreur, soit 32 centimes sur 100 grammes titrés 800.

Toute la chaîne est élargie, sinon la précision serait perdue dès l'étape suivante.
