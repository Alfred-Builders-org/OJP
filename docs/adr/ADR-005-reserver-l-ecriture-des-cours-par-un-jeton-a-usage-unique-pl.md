---
id: ADR-005
title: Réserver l'écriture des cours par un jeton à usage unique plutôt que par le rôle seul
status: accepted
---

## Contexte

Le relevé quotidien doit pouvoir être déclenché par le premier utilisateur qui ouvre l'application le matin, y compris un vendeur, alors que l'écriture des cours est réservée au propriétaire.

## Décision

La réservation du relevé du jour émet un jeton à usage unique. Le porteur du jeton écrit une fois, puis le jeton est consommé. Le propriétaire écrit sans jeton, par le bouton manuel. Tout autre appelant est rejeté.

## Conséquences

Un vendeur déclenche le relevé sans jamais obtenir le droit d'écrire les cours. La fonction reste exécutée avec les droits de son propriétaire, mais elle n'est plus une porte dérobée.

## Alternatives

Accorder l'écriture au rôle vendeur aurait ouvert la modification manuelle des cours, c'est-à-dire la possibilité de fausser tous les prix de la journée.
