---
id: ADR-014
title: Adopter Phosphor en duotone comme famille d'icônes unique
status: accepted
---

## Contexte

Le produit avait démarré avec la famille d'icônes livrée par défaut avec la bibliothèque d'interface, dont le rendu au trait manquait de présence dans des écrans denses.

## Décision

Phosphor en style duotone devient la famille unique, sur les titres de cartes comme sur les boutons. Les composants internes de la bibliothèque d'interface, qui embarquent leur propre famille, ne sont pas modifiés.

## Conséquences

Les écrans gagnent en lisibilité et en cohérence. Deux familles cohabitent dans les dépendances, ce qui est assumé plutôt que corrigé au prix d'une réécriture des composants générés.

## Alternatives

Migrer aussi les composants internes aurait signifié modifier des fichiers générés, que la convention du projet interdit d'éditer à la main.
