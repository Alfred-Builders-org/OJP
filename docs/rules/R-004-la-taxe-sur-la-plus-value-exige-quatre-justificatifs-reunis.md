---
id: R-004
title: La taxe sur la plus-value exige quatre justificatifs réunis
statement: Le régime de la plus-value n'est ouvert que si les quatre conditions sont réunies : facture au nom du client, scellés intacts, date d'acquisition et prix d'acquisition renseignés.
enforcement: test:src/lib/calculations/taxes.test.ts::retourne true quand toutes les conditions sont réunies
surface: fiscalite
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
source_feature: F-015
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `isTPVEligible`.

Les quatre justificatifs sont saisis sur la référence, objet par objet, et non sur le lot : deux bijoux du même client peuvent relever de régimes différents.

## Pourquoi

Le régime de la plus-value suppose de connaître le prix et la date d'acquisition, sans quoi il n'y a pas de plus-value à calculer. La facture au nom du client et les scellés intacts établissent que l'objet est bien celui qui a été acheté à ce prix.

Les quatre conditions sont cumulatives : il suffit qu'une manque pour que seul le régime forfaitaire reste ouvert.
