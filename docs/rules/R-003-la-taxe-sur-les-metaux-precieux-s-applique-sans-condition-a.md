---
id: R-003
title: La taxe sur les métaux précieux s'applique sans condition à 11,5 %
statement: La taxe sur les métaux précieux vaut 11,5 % du montant de la transaction, sans condition d'éligibilité ni seuil.
enforcement: test:src/lib/calculations/taxes.test.ts::calcule 11.5% sur un montant standard
surface: fiscalite
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-014
---

## Où elle est tenue

`src/lib/calculations/taxes.ts`, fonction `calculerTMP`.

## Pourquoi

La taxe sur les métaux précieux est le régime de droit commun de la cession d'or d'investissement : elle s'applique sur le montant total, sans condition et sans seuil. C'est ce qui la rend calculable même quand le client n'apporte aucun justificatif.

Elle sert de référence à la comparaison de [R-008](R-008-le-regime-fiscal-retenu-est-le-moins-couteux-pour-le-client.md) : le client paie le moins cher des deux régimes, jamais celui-ci par défaut.
