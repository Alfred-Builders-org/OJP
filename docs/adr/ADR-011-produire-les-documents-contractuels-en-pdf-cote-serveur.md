---
id: ADR-011
title: Produire les documents contractuels en PDF côté serveur
status: accepted
---

## Contexte

Douze types de pièces contractuelles sont à produire, portant les mentions légales et l'identité visuelle de la société, avec une mise en page fidèle et reproductible.

## Décision

Les PDF sont composés côté serveur à partir de composants React dédiés, alimentés par les textes et le style enregistrés en paramètres.

## Conséquences

Le rendu ne dépend pas du navigateur du poste. Les textes légaux et l'apparence se modifient depuis l'application, sans intervention technique.

## Alternatives

Une génération côté navigateur aurait rendu la mise en page dépendante du poste et de sa police disponible.
