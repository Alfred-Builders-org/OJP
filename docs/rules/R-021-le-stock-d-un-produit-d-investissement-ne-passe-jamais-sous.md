---
id: R-021
title: Le stock d'un produit d'investissement ne passe jamais sous zéro
statement: La quantité en stock d'un produit d'or d'investissement est contrainte à zéro ou plus, et toute décrémentation qui la ferait passer en négatif est rejetée avec un message explicite avant que la contrainte ne se déclenche.
enforcement: constraint
surface: stock
priority: 1
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-021
---

## Où elle est tenue

`supabase/migrations/087_*.sql` : une contrainte de vérification sur la quantité, doublée d'un message explicite levé par `increment_or_invest_quantite` avant que la contrainte ne se déclenche.

## Pourquoi

Vendre un produit qu'on n'a pas fausse l'inventaire et la comptabilité matière. La contrainte tient l'invariant ; le message rend l'échec lisible pour le vendeur, qui verrait sinon une erreur de base de données.

Les deux se complètent : la contrainte ne peut pas être contournée, le message ne peut pas être seul.
