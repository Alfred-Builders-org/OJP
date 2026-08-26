---
id: R-005
title: La plus-value s'abat avec la durée de détention et s'éteint à 22 ans
statement: La plus-value est taxée à 19 % au titre de l'impôt sur le revenu et 17,2 % au titre des prélèvements sociaux, abattus respectivement de 5 % et 1,6 % par année au-delà de la deuxième ; à 22 ans révolus de détention, l'exonération est totale.
enforcement: test:src/lib/calculations/taxes.test.ts::exonération totale après 22 ans de détention
surface: fiscalite
priority: 1
d025_class: fenetre_temporelle
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `calculerTPV`.

La durée de détention se compte en années révolues à la date du rachat, jour pour jour.

## Pourquoi

Le législateur récompense la détention longue : au delà de la deuxième année, chaque année écoulée réduit l'assiette, jusqu'à l'exonération totale à vingt-deux ans. Les deux abattements suivent des rythmes différents (5 % pour l'impôt sur le revenu, 1,6 % pour les prélèvements sociaux), ce qui les fait s'éteindre au même moment.

Quand il n'y a pas de plus-value, la taxe est nulle : un client qui revend à perte ne paie rien à ce titre.
