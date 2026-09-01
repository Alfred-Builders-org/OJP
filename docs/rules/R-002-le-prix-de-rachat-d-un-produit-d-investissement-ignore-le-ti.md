---
id: R-002
title: Le prix de rachat d'un produit d'investissement ignore le titre
statement: Le prix de rachat d'un lingot ou d'une pièce vaut cours du métal au gramme × poids catalogue × coefficient d'achat, sans facteur de titre : ces produits sont en or fin.
enforcement: test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour un lingot
surface: chiffrage
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-007
---

## Où elle est tenue

`src/lib/calculations/prix-rachat.ts`, fonction `calculerPrixRachatOrInvest`.

## Pourquoi

Un lingot ou une pièce d'investissement est en or fin : appliquer un titre reviendrait à le dévaluer d'un facteur qui n'a pas lieu d'être. Le poids vient du catalogue, pas d'une pesée, parce que ces produits sont normalisés.

C'est la seule différence de formule avec le rachat d'un bijou, et elle suffit à justifier deux fonctions distinctes plutôt qu'un paramètre optionnel.
