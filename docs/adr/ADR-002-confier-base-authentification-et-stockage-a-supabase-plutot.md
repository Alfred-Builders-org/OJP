---
id: ADR-002
title: Confier base, authentification et stockage à Supabase plutôt qu'à trois briques séparées
status: accepted
---

## Contexte

Le produit avait besoin d'un PostgreSQL, d'une authentification par e-mail et mot de passe, et d'un stockage de fichiers pour les pièces d'identité et les documents contractuels.

## Décision

Supabase porte les trois : PostgreSQL avec sécurité au niveau des lignes, authentification, et deux compartiments de stockage : l'un public pour les avatars, l'autre privé pour les documents.

## Conséquences

L'autorisation vit en base et suit la donnée quel que soit le chemin d'accès. Le revers est une dépendance forte : le schéma, les politiques de sécurité et les fonctions distantes sont tous portés par 136 migrations qu'il faut tenir en ordre.

## Alternatives

Un PostgreSQL nu avec une authentification maison aurait demandé d'écrire et de maintenir la gestion de session et de réinitialisation de mot de passe.
