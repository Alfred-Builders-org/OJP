---
id: ADR-008
title: Porter les cours au millième d'euro plutôt qu'au centime
status: accepted
---

## Contexte

Les cours au gramme étaient stockés avec deux décimales, alors que le formulaire en acceptait déjà trois. L'écart est négligeable sur l'or mais représente environ 0,25 % d'erreur sur l'argent, dont le cours au gramme avoisine 1,64 euro.

## Décision

Toute la chaîne (paramètres, instantanés du lot, cours utilisé par référence, lignes de bon de livraison) porte trois décimales.

## Conséquences

La précision se conserve d'un bout à l'autre du calcul. L'élargissement d'échelle d'un type numérique étant sans perte, la migration n'a rien altéré des valeurs existantes.

## Alternatives

N'élargir que la table des paramètres aurait perdu la précision dès l'étape suivante de la chaîne.
