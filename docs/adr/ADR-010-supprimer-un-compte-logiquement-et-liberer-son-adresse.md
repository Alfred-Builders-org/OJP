---
id: ADR-010
title: Supprimer un compte logiquement et libérer son adresse
status: accepted
---

## Contexte

Un compte supprimé physiquement emporte les mentions « créé par » des lots, dossiers et clients qu'il a produits. Mais un compte conservé garde son adresse e-mail, qui devient alors impossible à réutiliser.

## Décision

Le profil est conservé et l'accès banni ; l'adresse est neutralisée aux deux endroits où elle est stockée et l'adresse d'origine est conservée dans les métadonnées du compte.

## Conséquences

L'historique reste lisible et l'adresse redevient disponible pour un nouveau compte. L'opération est rejouable sans effet de bord.

## Alternatives

Une suppression physique aurait rendu illisible l'historique des opérations passées.
