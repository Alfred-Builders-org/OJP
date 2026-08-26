---
id: R-009
title: Un bijou se compare à la taxe forfaitaire, pas à la taxe sur les métaux
statement: Pour un bijou, l'alternative à la plus-value est la taxe forfaitaire sur les objets précieux ; la taxe sur les métaux précieux ne sert de référence que pour l'or d'investissement.
enforcement: test:src/lib/calculations/taxes.test.ts::choisit TFOP quand c'est moins cher ou égal
surface: fiscalite
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `regimeFiscalOptimalBijoux`.

## Pourquoi

La nature de l'objet commande le régime de référence : un bijou relève de la taxe forfaitaire sur les objets précieux, l'or d'investissement de la taxe sur les métaux précieux. Les confondre changerait le taux et, pour un bijou sous 5 000 euros, ferait payer une taxe là où il n'y en a pas.

Dans les deux cas, la plus-value reste l'alternative ouverte au client qui la justifie.
