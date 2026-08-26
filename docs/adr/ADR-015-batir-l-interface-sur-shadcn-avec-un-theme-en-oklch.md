---
id: ADR-015
title: Bâtir l'interface sur Shadcn avec un thème en OKLCH
status: accepted
---

## Contexte

Il fallait une bibliothèque de composants accessible et personnalisable, sans dépendre d'un paquet dont les mises à jour imposeraient leur rythme.

## Décision

Les composants sont générés dans le dépôt par l'outil Shadcn, et le thème est décrit par des variables CSS en espace OKLCH, ce qui rend les déclinaisons claire et sombre cohérentes en luminosité perçue.

## Conséquences

Les composants appartiennent au dépôt et se personnalisent. La contrepartie est qu'ils ne se mettent pas à jour tout seuls, et qu'un composant modifié à la main diverge de sa source.

## Alternatives

Une bibliothèque installée en dépendance aurait apporté les correctifs automatiquement, au prix d'une personnalisation contrainte par ce que la bibliothèque expose.
