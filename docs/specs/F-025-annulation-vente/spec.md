---
id: F-025
slug: annulation-vente
title: Annuler une vente et remettre les articles en stock
epic: E-008
domaine: [DOM-006, DOM-009]
surface: standard
dependencies: [F-018, F-022]
personas: [PER-002]
---

# Objectif

Une vente en cours peut être abandonnée, et son abandon rend chaque article à l'origine d'où il venait : le stock du comptoir, ou le contrat de dépôt-vente qui l'avait confié. La vente ne disparaît pas pour autant, elle reste close et marquée annulée.

## Intention

Un client se ravise, un chèque revient impayé, une commande n'aboutit pas : la vente doit pouvoir se refermer. Le vrai risque n'est pas l'abandon lui-même, c'est ce qu'il laisse derrière : un bijou marqué vendu qui dort dans une vitrine sans que rien ne le propose à la vente suivante, et un déposant dont l'article a disparu des comptes du comptoir alors qu'il lui appartient toujours.

L'abandon doit donc défaire exactement ce que la vente avait fait, article par article, et rendre chacun à l'état dans lequel il était avant. Un bijou repris au comptoir redevient disponible en vitrine ; un bijou confié par un déposant redevient un article sous contrat, avec tout ce que le contrat implique pour son propriétaire.

Et l'affaire abandonnée reste au dossier du client, close et lisible. Effacer une vente rendrait le comptoir incapable d'expliquer pourquoi un article est sorti du stock puis y est revenu.

## Hors-scope

- le remboursement de l'acompte déjà encaissé, qui s'enregistre au parcours des règlements comme un mouvement négatif
- l'annulation d'un lot de rachat, qui relève du cycle des rachats et de la rétractation
- la suppression pure et simple d'une vente : une vente annulée reste au dossier du client
- le sort du contrat de dépôt-vente lui-même, qui reprend son cours une fois l'article restitué

## Cas d'erreur

- la remise à disposition d'un article échoue : le vendeur en est averti par « Erreur lors de la mise à jour du stock » et l'article reste à vérifier avant de conclure
- la vente est déjà close : l'annulation n'est plus offerte, elle ne s'ouvre que depuis une vente en cours

## Brief produit

### Purpose

Refermer une vente abandonnée sans laisser d'article orphelin : chacun revient exactement à l'endroit et à l'état d'où la vente l'avait tiré.

### User

Le vendeur au comptoir, qui abandonne l'affaire devant le client ou après coup. Le propriétaire, qui doit retrouver dans le stock ce que la vente avait sorti, et comprendre pourquoi.

### Content

Une confirmation explicite avant d'abandonner, parce que le geste ne se défait pas. Après l'abandon : la vente close, marquée annulée et signalée comme telle, et chaque article revenu à son état d'origine, disponible en vitrine ou de nouveau sous contrat de dépôt-vente.

## Notes techniques

Le bouton d'annulation et son dialogue vivent dans `src/components/ventes/vente-status-actions.tsx:315,381` (confirmation destructive « Oui, annuler »). `handleAnnuler` boucle sur les lignes, lit `bijoux_stock.depot_vente_lot_id` pour chaque `bijoux_stock_id`, écrit `statut = 'en_depot_vente'` si le bijou venait d'un contrat et `statut = 'en_stock'` sinon, puis passe le lot en `status = 'finalise'` avec `outcome = 'annule'` (migration `081_simplify_lot_statuses.sql`). Le badge rend « Annulé » en rouge (`lot-status-badge.tsx:17`).

Même règle de retour à l'origine côté base, dans `cancel_expired_acompte_lots()` (`027_auto_cancel_expired_acompte.sql:24-31`) : `CASE WHEN depot_vente_lot_id IS NOT NULL THEN 'en_depot_vente' ELSE 'en_stock' END`. Les deux chemins doivent rester d'accord.

La suppression d'une ligne isolée restitue également le stock (`src/components/ventes/vente-detail-page.tsx:187`, toast d'échec « Erreur lors de la mise à jour du stock »).
