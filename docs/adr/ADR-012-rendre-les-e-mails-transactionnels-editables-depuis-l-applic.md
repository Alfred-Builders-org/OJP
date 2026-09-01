---
id: ADR-012
title: Rendre les e-mails transactionnels éditables depuis l'application
status: accepted
---

## Contexte

Dix envois jalonnent le parcours client et interne. Leur formulation appartient au métier et change plus souvent que le code.

## Décision

Les modèles d'e-mail sont stockés en base et éditables depuis l'application ; l'envoi passe par un service tiers dédié, et chaque envoi est journalisé.

## Conséquences

Une reformulation ne demande pas de livraison. Le revers est qu'un modèle mal formé n'est détecté qu'à l'envoi.

## Alternatives

Des modèles dans le code auraient été vérifiés à la compilation, au prix d'une livraison pour chaque correction de formulation.
