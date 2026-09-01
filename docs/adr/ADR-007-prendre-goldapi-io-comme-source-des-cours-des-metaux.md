---
id: ADR-007
title: Prendre goldapi.io comme source des cours des métaux
status: accepted
---

## Contexte

Il fallait une source de cours pour l'or, l'argent et le platine, exprimée au gramme, accessible par une interface de programmation simple.

## Décision

goldapi.io est interrogé et son prix du gramme en 24 carats est retenu comme cours de référence du métal pur.

## Conséquences

Une clé d'interface tierce est à tenir. La disponibilité de la source conditionne la fraîcheur des cours, atténuée par la conservation des cours de la veille et le contrôle de vraisemblance.

## Alternatives

Une saisie entièrement manuelle a été écartée : le constat de recette a montré qu'une valeur saisie à la main peut être fausse d'un facteur vingt-cinq sans que rien ne s'y oppose.
