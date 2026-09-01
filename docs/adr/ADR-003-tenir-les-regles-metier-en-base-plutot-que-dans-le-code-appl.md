---
id: ADR-003
title: Tenir les règles métier en base plutôt que dans le code applicatif
status: accepted
---

## Contexte

Un constat de recette a montré qu'une vérification faite seulement dans l'interface se contourne : deux règlements fautifs avaient été saisis hors du parcours prévu, sur des lots rétractés, sans que rien ne s'y oppose.

## Décision

Les invariants métier (transitions d'état, blocage des versements sur opération close, stock non négatif, vraisemblance des cours) sont portés par des déclencheurs et des contraintes PostgreSQL, pas par le code applicatif.

## Conséquences

La règle tient quel que soit le chemin de saisie, y compris depuis un outil d'administration. En contrepartie, les messages d'erreur remontent de la base et doivent être traduits pour l'utilisateur, et une règle se corrige par migration.

## Alternatives

Une validation centralisée côté serveur aurait été plus simple à faire évoluer, mais elle laisse ouverte la voie d'accès direct à la base, précisément celle qui a produit l'anomalie constatée.
