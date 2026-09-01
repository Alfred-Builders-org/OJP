---
id: F-017
slug: inventaire-bijoux-repris
title: Tenir l'inventaire des bijoux repris et leur destination
epic: E-006
domaine: [DOM-006]
surface: standard
dependencies: [F-007]
personas: [PER-002, PER-001]
---

# Objectif

Chaque bijou racheté part soit à la fonte, soit à la revente : le stock tranche. L'article naît tout seul au moment où le rachat est acquis, avec ce que le chiffrage a déjà mesuré.

## Intention

Jusqu'ici, ce que devenait un bijou après le rachat ne vivait que dans la tête de celui qui l'avait rangé : un sachet dans le coffre pour la fonderie, une pièce en vitrine, et rien pour dire laquelle était laquelle ni d'où elle venait. Quand un client revient trois semaines plus tard, ou quand il faut préparer un envoi à la fonderie, personne ne peut reconstituer l'inventaire autrement qu'en ouvrant les tiroirs.

L'article de stock règle cela : il se crée sans qu'on le saisisse, il reprend mot pour mot ce que le vendeur a désigné, pesé et payé, et il garde le nom du client qui l'a apporté. La question « d'où vient cette bague et combien l'a-t-on payée » a désormais une réponse à l'écran.

Par défaut, l'article se range du côté de la fonte : c'est le sort le plus courant d'un bijou repris, et c'est aussi le choix qui protège la marge. En faire un article de boutique est un geste délibéré, posé sur la fiche de l'article.

## Hors-scope

- la vente de l'article, son départ effectif à la fonderie et sa mise en dépôt-vente : le stock dit où en est chaque pièce, il ne la sort pas
- les articles confiés en dépôt-vente, tenus sur leur propre liste avec leur déposant
- la photographie et la description commerciale de l'article pour la vitrine

## Cas d'erreur

- la destination choisie sur la référence au moment du chiffrage n'est pas celle que porte l'article créé : tout bijou repris en rachat entre avec la destination fonte, il n'apparaît donc pas dans la liste des bijoux tant qu'on ne l'a pas remis en stock depuis sa fiche, et la carte d'attention « Destination des références » reste affichée sur le lot tant qu'il n'est pas soldé

## Brief produit

### Purpose

Faire exister l'inventaire des bijoux repris sans double saisie, et rendre lisible d'un coup d'oeil ce qui est destiné à la boutique et ce qui attend la fonte.

### User

Le vendeur au comptoir, qui range le bijou et doit le retrouver. Le propriétaire, qui veut savoir ce que la maison détient et ce qu'elle l'a payé.

### Content

La liste des bijoux ne montre que ce qui vit en boutique : ni les articles en dépôt-vente, ni ceux destinés à la fonte ou déjà fondus. Chaque ligne porte la désignation, le métal, la qualité, le poids, le prix d'achat, le prix de revente estimé et la quantité, plus une colonne d'origine qui nomme le client et dit si l'article vient d'un rachat ou d'un dépôt-vente. Sur le lot, une carte d'attention rappelle de choisir la destination de chaque référence avant de finaliser, avec le texte « Sélectionnez la destination de chaque référence avant de finaliser le lot. »

## Notes techniques

L'entrée est faite par `createBijouxStockEntry` (`src/lib/actions/stock-operations.ts:8-60`), appelee depuis `lot-actions.ts:136` (finalisation du lot) et `reference-actions.ts:69` (validation d'une reference seule). Elle insere dans `bijoux_stock` nom, metaux, qualite, poids (`poids_net` a defaut `poids`), `poids_brut`, `poids_net`, `prix_achat`, `prix_revente`, `quantite`, avec `statut = 'a_fondre'` ou `'en_depot_vente'`, puis met `lot_references.status` a `route_fonderie` ou `en_depot_vente` et renseigne `destination_stock_id`.

La liste (`src/app/(dashboard)/stock/page.tsx`) filtre `depot_vente_lot_id IS NULL` et `statut NOT IN (a_fondre, fondu)`, paginee par `?page=&size=`, et reconstitue l'origine en joignant `lot_references.destination_stock_id` vers `lots.dossiers.clients`.

Le champ `lot_references.destination` (`DESTINATION_OPTIONS` dans `src/lib/validations/lot.ts:37-41`, valeurs `stock_boutique` / `fonderie` / `depot_vente`) est enregistre par `destination-selector.tsx` mais n'est pas relu par `createBijouxStockEntry` : d'ou l'ecart decrit en cas d'erreur. La carte ambre du selecteur applique R-032 (`border-amber-200 bg-amber-50 dark:bg-amber-950/20`). Migrations `003_create_bijoux_stock.sql` et `051_bijoux_stock_a_fondre.sql`.
