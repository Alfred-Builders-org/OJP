---
id: R-022
title: Aucune opération ne s'ouvre sans pièce d'identité valide
statement: La création d'un dossier est refusée tant que le client ne porte pas une pièce d'identité enregistrée et non expirée.
enforcement: constraint
surface: conformite
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
source_feature: F-002
---

## Où elle est tenue

`supabase/migrations/077` et `078`, complétées par la garde d'interface posée au commit `b6fa8c4`.

## Pourquoi

Le rachat de métaux précieux est une activité réglementée : l'identité du vendeur doit être établie et vérifiable. Une pièce expirée ne l'établit plus.

Le blocage vaut à l'ouverture du dossier, donc avant tout chiffrage, pour que le vendeur ne s'engage pas sur un prix qu'il devra retirer. La feature F-003 prévient avant que ce blocage ne tombe, sur un seuil de jours réglable.
