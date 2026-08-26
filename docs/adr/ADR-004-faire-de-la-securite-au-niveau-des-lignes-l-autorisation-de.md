---
id: ADR-004
title: Faire de la sécurité au niveau des lignes l'autorisation de référence
status: accepted
---

## Contexte

Trois rôles coexistent, dont un vendeur qui ne doit voir ni les fonderies, ni les commandes, ni les paramètres en écriture.

## Décision

Les droits sont portés par les politiques de sécurité au niveau des lignes, adossées à deux fonctions de session donnant le rôle et le caractère actif du compte. Le contrôle exercé dans l'intergiciel de l'application ne fait que doubler ce verrou pour éviter d'afficher une page vide.

## Conséquences

Une requête qui échapperait à l'intergiciel ne rapporte rien. Le revers a été mesuré : une lecture fermée par excès de prudence faisait chiffrer les lots à zéro pour un vendeur, sans aucun avertissement, et il a fallu rouvrir la lecture des paramètres.

## Alternatives

Une autorisation uniquement applicative aurait été plus lisible d'un coup d'œil, au prix d'un contournement possible par tout accès direct.
