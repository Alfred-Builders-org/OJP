---
id: F-024
slug: livraison-et-cloture-vente
title: Livrer les articles d'une vente et clore l'opération
epic: E-008
domaine: [DOM-009]
surface: standard
dependencies: [F-022]
personas: [PER-002, PER-004]
---

# Objectif

Constater article par article la remise des marchandises au client, et clore la vente quand tout est remis et payé. Tant qu'un article reste à remettre, la vente le signale au vendeur dans ses actions du jour.

## Intention

Une vente ne se termine pas au moment où le client paie : elle se termine quand il repart avec ce qu'il a acheté. Les bijoux de vitrine partent tout de suite, mais un produit d'investissement commandé à une fonderie arrive des jours plus tard, et il faut alors rappeler au client de passer le chercher. Entre les deux, l'article dort dans un coffre sans que personne ne sache qu'il attend son propriétaire.

Le comptoir a donc besoin de deux choses. D'abord une liste vivante de ce qui est prêt et pas encore remis, pour que le vendeur voie sans chercher les clients à rappeler. Ensuite une clôture qui tombe toute seule quand il n'y a plus rien à attendre : ni article en attente, ni argent en attente. Une vente qui reste ouverte alors que tout est fait finit par polluer chaque écran de suivi et rend le vrai retard invisible.

## Hors-scope

- la commande et la réception des produits auprès d'une fonderie, qui précèdent la remise au client
- l'encaissement du solde, qui relève du parcours des règlements
- l'annulation d'une vente, qui suit son propre chemin et rend les articles à leur origine
- la remise d'un bijou invendu à son déposant, qui appartient au contrat de dépôt-vente

## Cas d'erreur

- plus aucun article n'est en attente de remise : l'écran de livraison affiche « Aucun article à livrer. » et il n'y a rien à constater
- tous les articles sont remis mais le solde n'est pas encaissé : la vente ne se clôt pas d'elle-même, et sa clôture reste un geste du vendeur

## Brief produit

### Purpose

Rendre visible ce qui est prêt et pas encore remis, constater la remise, et fermer la vente au moment exact où il n'y a plus rien à attendre.

### User

Le vendeur au comptoir, qui remet les articles et rappelle les clients dont la commande est arrivée. Le client particulier, qui vient chercher ce qu'il a acheté et dont l'affaire doit être close proprement.

### Content

Par ligne de vente : l'article, son état de mise à disposition, et le fait qu'il ait été remis ou non. Pour la vente : le nombre d'articles restant à livrer, et son statut une fois close. Dans les actions du jour : une entrée par vente ayant des articles prêts et non remis.

## Notes techniques

Chaque `vente_lignes` porte `is_livre`. Les bijoux sont marqués livrés dès la finalisation (`src/lib/actions/finalize-actions.ts:818-830` : passage du stock en `reserve` et `is_livre = true`), tandis que les lignes d'or d'investissement attendent leur `fulfillment`.

`src/lib/actions/action-registry.ts:222-237` produit l'entrée « {numero} | {n} article(s) à livrer au client » dès qu'une ligne est `servi_stock` ou `recu` sans être livrée. `src/components/actions/livraison-dialog.tsx` liste les lignes restantes et déclenche le toast « Vente finalisée automatiquement » quand tout est livré et payé. La clôture manuelle passe par `src/components/ventes/vente-status-actions.tsx:275,357` et écrit `status = 'finalise'` avec `outcome = 'complete'`.

Second chemin de clôture : depuis `src/components/commandes/bon-commande-detail-page.tsx:216-257`, marquer un article livré (toasts « Article marqué comme livré au client » et « Articles marqués comme livrés au client ») finalise la vente quand tous les bons de commande liés sont payés. Migration de référence : `026_vente_livraison_ligne_acompte.sql`.
