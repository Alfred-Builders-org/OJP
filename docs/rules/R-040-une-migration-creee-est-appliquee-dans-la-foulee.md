---
id: R-040
title: Une migration créée est appliquée dans la foulée
statement: Après création ou modification d'une migration de base de données, la commande de publication est exécutée sans attendre de demande : une migration écrite mais non appliquée fait diverger le schéma local du schéma servi.
enforcement: advisory
surface: contribution
priority: 2
d025_class: advisory_irreductible
status: active
risk: standard
---

## Où elle est tenue

`CLAUDE.md`. La commande de publication s'exécute après création ou modification d'une migration, sans attendre qu'on la demande.

## Pourquoi

Une migration écrite mais non appliquée fait diverger le schéma local du schéma servi. La divergence ne se voit pas tout de suite : elle se manifeste plus tard, sur une requête qui marche chez l'un et pas chez l'autre, et le temps perdu à en trouver la cause est sans rapport avec celui qu'aurait coûté la commande.

Le dépôt porte 136 migrations : leur ordre et leur application intégrale sont ce qui rend l'état de la base reproductible.
