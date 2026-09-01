---
id: F-030
slug: confie-achat
title: Suivre les articles confiés à l'achat à part du stock détenu
epic: E-009
surface: standard
domaine: [DOM-011]
dependencies: [F-026]
personas: [PER-002, PER-004]
---

# Objectif

Un article confié en vue d'un achat n'est pas la propriété de la maison et se compte à part du stock détenu. Il dispose de sa propre page, de sa propre fiche et du nom de celui qui l'a confié.

## Intention

Deux bijoux posés côte à côte dans la même vitrine peuvent avoir deux statuts juridiques opposés : l'un a été racheté et appartient au comptoir, l'autre a seulement été confié et appartient encore à un particulier. Les mélanger dans une même liste, c'est se tromper sur ce que vaut réellement le stock, et risquer de vendre ou de fondre un bien dont on n'est pas propriétaire.

Le comptoir sépare donc les deux comptes de façon symétrique : ce qui lui appartient d'un côté, ce qui lui est confié de l'autre, avec pour chaque article confié le nom du déposant, le dépôt dont il provient et la date à laquelle il est entré. Un vendeur qui ouvre une fiche sait immédiatement à qui rendre des comptes, et peut lancer la restitution depuis cette fiche tant que l'article est encore en dépôt.

Le déposant, lui, a signé un reçu qui nomme précisément ce qu'il a laissé et affirme qu'il en est le propriétaire légitime. La fiche de l'article est le pendant interne de ce reçu.

## Hors-scope

- le stock des bijoux détenus par la maison, qui a sa propre page et ses propres règles
- la mise en dépôt elle-même et le contrat qui la porte, qui appartiennent au parcours de dépôt-vente
- la vente de l'article confié et le reversement au déposant, qui appartiennent au parcours de vente

## Cas d'erreur

- le dépôt d'origine d'un article confié n'a pas pu être retrouvé : la fiche reste consultable et annonce au vendeur que les informations du déposant ne sont pas disponibles, au lieu d'afficher un bloc vide

## Brief produit

### Purpose

Tenir deux comptes distincts pour deux situations juridiques distinctes, et rattacher chaque article confié à la personne qui en est encore propriétaire.

### User

Le vendeur au comptoir, qui doit savoir à qui appartient ce qu'il manipule. Le client particulier, déposant, dont le bien est chez le comptoir sans lui avoir été vendu.

### Content

Par ligne : la désignation, le statut, le nom du déposant, le numéro du dépôt et la date de dépôt. Par fiche : le statut, le métal (Or, Platine ou Argent), la qualité, le poids, les prix, un bloc déposant, et la restitution tant que l'article est en dépôt.

## Notes techniques

Le cloisonnement tient à un seul champ : `bijoux_stock.depot_vente_lot_id`. La page « Bijoux » filtre sur `IS NULL`, la page « Confié d'achat » sur `IS NOT NULL` (`confie-achat/page.tsx:31-37`), avec une entrée dédiée du groupe Stock dans `sidebar-nav.tsx`. Le nom du déposant, le numéro et l'identifiant du dépôt ainsi que la date de dépôt (`lot.date_finalisation`) sont reconstitués par jointure sur `lot_references.destination_stock_id`.

`confie-achat-detail-page.tsx` affiche « Informations déposant non disponibles. » quand la jointure ne rend rien, et n'expose la restitution que si `statut === 'en_depot_vente'`. Le document `confie_achat` (préfixe CON) est produit par `pdf/confie-achat.ts` à la finalisation du dépôt-vente, avec le texte figé « Le vendeur déclare avoir atteint la majorité légale, être le propriétaire légitime des biens... ».
