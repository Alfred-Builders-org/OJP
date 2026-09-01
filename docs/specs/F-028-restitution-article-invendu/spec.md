---
id: F-028
slug: restitution-article-invendu
title: Restituer un article invendu et facturer les frais prévus au contrat
epic: E-009
surface: standard
domaine: [DOM-006, DOM-010]
dependencies: [F-026]
personas: [PER-002, PER-004]
---

# Objectif

Un article confié qui n'a pas trouvé preneur repart chez son déposant, article par article, et sort du compte du dépôt-vente. Le reçu qui l'accompagnait est annulé du même geste.

## Intention

Chaque article confié a deux issues possibles et deux seulement : vendu, ou rendu. Tant qu'il n'a reçu ni l'une ni l'autre, il reste inscrit au dépôt-vente et compte comme marchandise détenue, alors qu'il peut être depuis longtemps reparti dans la poche de son propriétaire. Un dépôt qui ne se solde jamais fausse le compte de ce que le comptoir détient sans le posséder.

Le vendeur veut donc pouvoir rendre les articles à la pièce, quand le déposant se présente, sans être obligé de solder tout le dépôt d'un coup : un déposant reprend souvent une bague et laisse le reste en vitrine. Ce qui est rendu doit se voir comme rendu, ce qui reste doit rester proposable, et quand plus rien ne reste le dépôt doit se refermer de lui-même.

Le déposant, de son côté, ne doit plus pouvoir se voir opposer le reçu qu'il avait signé pour un bien qu'il a repris : le confié d'achat de l'article rendu perd sa valeur au moment de la restitution.

## Hors-scope

- la facturation du forfait de nettoyage et des frais de garde : ces montants sont des clauses écrites au contrat, réglées entre les parties, et ne donnent lieu à aucune pièce produite par le comptoir
- la restitution d'un article déjà vendu, qui ne se présente jamais parmi les articles restituables
- la reprise d'un article rendu dans un nouveau dépôt, qui passe par un nouveau contrat

## Cas d'erreur

- tous les articles du dépôt ont déjà été rendus : plus aucun article n'est proposé à la restitution et l'écran l'annonce au vendeur au lieu de lui présenter une liste vide

## Brief produit

### Purpose

Solder un dépôt article par article, et faire tomber en même temps la trace de détention et le reçu qui l'accompagnait.

### User

Le vendeur au comptoir, qui rend le bien de la main à la main et doit pouvoir le pointer. Le client particulier, déposant, qui repart avec son bien et ne veut plus être engagé dessus.

### Content

Par article restituable : la désignation, le métal, la qualité, le poids, la quantité et le net déposant. Par article déjà rendu : la même ligne, marquée comme restituée.

## Notes techniques

`restituerReference` (`stock-operations.ts:97-140`) passe `lot_references.status` en `rendu_client`, le `bijoux_stock` lié en `rendu_client`, puis bascule en `status = 'annule'` (migration 118) les `documents` de type `confie_achat` rattachés à cette référence via `document_references`. `checkAndFinalizeLot` clôture ensuite le lot quand toutes les références sont terminées. Le même geste est exposé par `restitution-dialog.tsx` (filtre sur `status === 'en_depot_vente'`) et par `confie-achat-detail-page.tsx:171,200-204`.

Les réglages `forfait_nettoyage` (20 €) et `frais_garde_mois` (10 €) ne sont lus par aucun calcul ni document : ils n'apparaissent que dans le texte figé des clauses `CDV_CLAUSES`.
