---
id: R-007
title: La TVA d'une revente porte sur la marge, jamais sur le prix
statement: Sous le régime des biens d'occasion (article 297 A du CGI), la TVA vaut 20 % de la marge (prix de vente moins prix d'achat), et zéro si la marge est nulle ou négative.
enforcement: test:src/lib/calculations/taxes.test.ts::calcule 20% sur la marge positive
surface: fiscalite
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `calculerTVAMarge`.

## Pourquoi

Régime des biens d'occasion, article 297 A du code général des impôts. Une maison qui rachète à un particulier ne récupère aucune taxe en amont : la taxer sur le prix de vente entier la ferait payer deux fois. La taxe porte donc sur la seule marge.

Si la marge est nulle ou négative, il n'y a rien à taxer. C'est le cas d'un article revendu à perte, qui arrive sur du stock ancien.
