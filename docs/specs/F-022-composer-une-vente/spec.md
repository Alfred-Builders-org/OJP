---
id: F-022
slug: composer-une-vente
title: Composer une vente depuis le stock, le catalogue ou une commande à passer
epic: E-008
domaine: [DOM-006, DOM-007, DOM-009]
surface: standard
dependencies: [F-005, F-017, F-020]
personas: [PER-002, PER-004]
---

# Objectif

Une vente rassemble en un seul lot des articles d'origines différentes : un bijou repris au comptoir, un produit d'or d'investissement disponible, ou un produit encore à commander. Chaque ligne porte le prix et la taxe de son origine, et le total de la vente suit ses lignes sans que personne ait à le ressaisir.

## Intention

Un client qui repart avec deux bijoux de vitrine et trois pièces d'investissement fait une seule affaire, pas cinq. Tant que le comptoir compose ces sorties article par article sur un cahier, il perd le lien entre ce qui a été vendu et ce qui sort du stock, il recompte les taxes à la main, et il découvre au moment de facturer que le total annoncé au client ne tombe pas juste.

La vente devient donc une affaire unique : le vendeur pioche chaque article là où il vit, l'application propose le prix que le comptoir a fixé pour cet article, applique la taxe qui correspond à son origine, et tient le total à jour à chaque ligne ajoutée ou retirée. Le bijou revendu en propre ne relève pas de la même taxe que celui confié par un déposant, et l'or d'investissement n'en supporte aucune : cette distinction est portée par la ligne elle-même, pas par la mémoire du vendeur.

Ce que le vendeur y gagne est du temps et une certitude : le montant qu'il annonce au client est celui qui sera facturé, et l'article vendu est celui qui quitte le stock.

## Hors-scope

- la commande à une fonderie des produits d'investissement non disponibles : elle part vers la filière fonderie et revient ici seulement pour la remise au client
- l'encaissement de l'argent et l'émission des factures, qui relèvent du parcours des règlements et des pièces contractuelles
- la part due au déposant sur un bijou de dépôt-vente, qui se règle dans le contrat de dépôt-vente
- la fixation du prix de revente d'un bijou et du prix du catalogue d'investissement, décidée en amont de la vente

## Cas d'erreur

- le vendeur valide l'ajout sans avoir choisi d'article dans la recherche du stock : l'ajout est refusé et l'écran affiche « Veuillez sélectionner un bijoux du stock. »
- le bijou est revendu à un prix inférieur ou égal à son prix de rachat : la ligne ne porte aucune taxe, puisqu'il n'y a pas de marge à taxer

## Brief produit

### Purpose

Faire tenir dans une affaire unique des articles qui ne viennent pas du même endroit et ne se taxent pas de la même façon, avec un total qui reste vrai à chaque changement.

### User

Le vendeur au comptoir, qui compose la vente devant le client et lui annonce un montant. Le propriétaire, qui relit ensuite ce que la vente a fait sortir et ce qu'elle a rapporté.

### Content

Pour un bijou repris : la désignation, le métal, la qualité, les poids, le prix de revente augmenté des réparations réellement payées, et la taxe qui correspond à son origine. Pour un produit d'or d'investissement : le produit du catalogue, une quantité, un prix unitaire, et l'indication de ce qui est servi du disponible et de ce qui reste à commander. Pour la vente entière : « Total articles », « Total taxes » et « Total TTC ».

## Notes techniques

Un lot de type `vente` porte des `vente_lignes` de deux origines. Le dialogue de sélection lit `bijoux_stock` et propose `prix_revente` augmenté de la somme des `cout_reel` des réparations terminées ; la ligne conserve `bijoux_stock_id` et `cout_reparation`. Le formulaire d'or d'investissement lit le catalogue et conserve `or_investissement_id` avec un champ `fulfillment` (`pending | servi_stock | a_commander | commande | recu`).

La taxe de ligne est typée par `vente_lignes.type_taxe` (migration 121) : `tva_marge` pour un bijou racheté, `tfop` pour un bijou de dépôt-vente, nul pour l'or d'investissement. Les fonctions `calculerTVAMarge` et `calculerTFOP` vivent dans `src/lib/calculations/taxes.ts`.

Les totaux du lot (`total_prix_revente`, `montant_taxe`) sont recalculés par le déclencheur `update_vente_totals` à chaque écriture de ligne : aucune écriture applicative ne doit les fixer (R-044). Migrations de référence : `014_create_ventes.sql`, `018_vente_or_investissement.sql`, `121_vente_ligne_type_taxe.sql`.
