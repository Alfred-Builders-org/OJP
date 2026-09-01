---
id: R-006
title: La taxe forfaitaire sur les objets précieux ne mord qu'au-delà de 5 000 €
statement: La taxe forfaitaire sur les objets précieux vaut 6,5 % (6 % plus 0,5 % de CRDS) du montant de cession, et zéro si ce montant est inférieur ou égal à 5 000 €.
enforcement: test:src/lib/calculations/taxes.test.ts::retourne 0 pour un montant ≤ 5000 €
surface: fiscalite
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `calculerTFOP`. Le régime a été ajouté comme troisième choix par la migration `120_add_tfop_regime_fiscal.sql`.

## Pourquoi

La taxe forfaitaire sur les objets précieux vise les bijoux et objets d'art, là où la taxe sur les métaux précieux vise l'or d'investissement. Son taux réunit 6 % de taxe et 0,5 % de contribution au remboursement de la dette sociale.

Le seuil de 5 000 euros exonère les petites cessions : c'est ce qui rend le rachat d'un bijou courant non taxé au titre de ce régime.
