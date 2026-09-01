---
id: R-008
title: Le régime fiscal retenu est le moins coûteux pour le client
statement: Entre la plus-value et la taxe applicable par défaut, le régime retenu est celui dont le montant est le plus faible ; à égalité, le régime par défaut l'emporte.
enforcement: test:src/lib/calculations/taxes.test.ts::choisit TPV quand c'est moins cher que TMP
surface: fiscalite
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `regimeFiscalOptimal`.

## Pourquoi

Le client a le droit d'opter pour le régime de la plus-value quand il peut le justifier. Lui proposer d'office le régime forfaitaire, plus simple pour la maison, lui ferait payer davantage sans qu'il le sache.

À montant égal, le régime par défaut l'emporte : il ne demande aucun justificatif à conserver, et n'expose donc à aucun litige ultérieur sur une pièce manquante.
