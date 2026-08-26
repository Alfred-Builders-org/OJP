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
