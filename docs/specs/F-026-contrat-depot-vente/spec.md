---
id: F-026
slug: contrat-depot-vente
title: Mettre des articles en dépôt-vente sous contrat à durée déterminée
epic: E-009
surface: standard
domaine: [DOM-006, DOM-010, DOM-012]
dependencies: [F-005, F-035]
personas: [PER-002, PER-004]
---

# Objectif

Un tiers confie un bien à la vente contre commission, et le comptoir émet le contrat qui l'engage. Les articles ne rejoignent le compte du dépôt-vente qu'une fois ce contrat signé.

## Intention

Un article posé en vitrine au titre d'un dépôt-vente n'appartient pas à la maison, et rien ne le distingue à l'oeil d'un bijou racheté. Sans contrat écrit, le prix affiché au public, la part qui reviendra au déposant et la commission du comptoir reposent sur une conversation dont personne ne garde trace, et le déposant n'a aucune pièce à opposer le jour où il vient réclamer son bien ou son argent.

Le comptoir compose donc le dépôt comme il compose un rachat, article par article, avec pour chacun le prix net qui reviendra au déposant et le prix affiché en vitrine. La commission qui les sépare est celle réglée par le propriétaire, pas une improvisation de comptoir. À la finalisation, le déposant repart avec un contrat et un reçu par article, et le comptoir avec une trace de ce qu'il détient sans le posséder.

La signature est la charnière. Tant qu'elle n'a pas eu lieu, les articles restent en expertise et ne comptent nulle part comme marchandise disponible : personne ne peut vendre un bien que son propriétaire n'a pas encore accepté de confier.

## Hors-scope

- le suivi du terme du contrat et le rappel de son échéance, qui font l'objet d'une capacité à part
- la vente de l'article et le reversement de la part du déposant, qui appartiennent au parcours de vente
- la restitution de l'article invendu, qui a son propre parcours

## Cas d'erreur

- le lot est finalisé mais le contrat n'est pas encore signé : les articles restent en expertise et n'apparaissent pas au compte du dépôt-vente, le vendeur ne peut donc pas les mettre en vente
- l'émission de l'une des pièces du dépôt échoue : la finalisation entière est refusée, le motif d'échec de génération est affiché et le lot reste ouvert

## Brief produit

### Purpose

Donner une existence écrite au dépôt : ce que le comptoir détient, à quel prix il l'expose, ce qu'il reversera, et à partir de quand il en a la garde.

### User

Le vendeur au comptoir, qui reçoit le déposant, décrit les articles et fixe les prix avec lui. Le client particulier, qui signe le contrat et repart avec ses pièces.

### Content

Par article : la désignation, le métal et la qualité, le poids, le prix net déposant, le prix affiché public, et la commission qui les sépare. Au niveau du dépôt : le contrat de dépôt-vente et ses onze clauses, plus un confié d'achat par article.

## Notes techniques

Le lot de type `depot_vente` est composé avec `reference-form-bijoux.tsx` en mode dépôt-vente ; la commission est pré-remplie depuis `business_rules.commission_dv_pct` et le prix de revente calculé comme `prix_achat * (1 + commission / 100)`. `processDepotVenteLot` (`finalize-actions.ts:512-582`) émet le `contrat_depot_vente` (préfixe CDV) et un `confie_achat` (préfixe CON) par référence, puis passe le lot en `en_cours` ; les références restent en `en_expertise`. L'action `doc.signer_contrat_dpv` (`action-executor.ts:40-90`) crée les lignes `bijoux_stock` en `en_depot_vente` avec `depot_vente_lot_id` et `deposant_client_id`.

Les onze clauses du contrat sont des constantes en dur dans `CDV_CLAUSES` (`pdf/blocks.ts:112`), durée d'un an et préavis de sept jours compris : le réglage `contrat_dv_duree_mois` n'est lu nulle part et `lots.date_fin_contrat` (migration 057) n'est jamais écrite par le code applicatif.
