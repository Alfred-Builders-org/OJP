---
id: F-018
slug: cycle-de-vie-bijou
title: Suivre l'état d'un bijou de son entrée à sa sortie
epic: E-006
domaine: [DOM-006]
surface: standard
dependencies: [F-017]
personas: [PER-002]
---

# Objectif

En stock, en dépôt-vente, en réparation, vendu, fondu. La fiche d'un article dit où il en est, et par quels passages il y est arrivé.

## Intention

Un bijou repris ne reste pas immobile : il attend la fonte, on décide finalement de le vendre, il part chez le réparateur, un client le réserve, il se vend, ou bien il repart chez son déposant sans avoir trouvé preneur. Chacun de ces moments a des conséquences ailleurs, mais du point de vue du comptoir la seule question qui compte est celle qu'on pose en tenant la fiche en main : où en est cette pièce, aujourd'hui.

L'article porte donc un état, et cet état est le même partout : sur la liste, sur la fiche, dans le sélecteur de la vente. Le vendeur n'a pas à faire la différence entre huit nuances quand il balaie une liste, il a besoin de trois repères, entrée, présence en boutique, sortie. Ces trois repères sont ce que la fiche montre, et les nuances restent lisibles en dessous.

Deux passages se pilotent à la main depuis la fiche, parce qu'ils relèvent d'une décision commerciale et de rien d'autre : renoncer à fondre une pièce pour la mettre en vitrine, et se raviser en la renvoyant vers la fonte. Les autres passages sont la conséquence d'un acte enregistré ailleurs.

## Hors-scope

- les actes qui provoquent les passages : la vente, la mise en dépôt-vente, l'envoi effectif à la fonderie et le retour d'un bon de livraison sont tenus dans leurs périmètres
- l'historique daté de chaque changement d'état : la fiche montre l'état courant, pas la chronologie complète
- les états des références du lot de rachat, qui suivent leur propre cheminement jusqu'à la finalisation

## Cas d'erreur

- un article rendu à son déposant sans avoir été vendu est bien une sortie, mais ce n'est pas un succès : la fiche le signale en attention et non en vert, pour que le vendeur ne confonde pas une restitution avec une vente en balayant les fiches

## Brief produit

### Purpose

Donner à tout instant une réponse unique et lisible à la question « où en est cette pièce », et rendre les deux arbitrages commerciaux réversibles d'un clic.

### User

Le vendeur au comptoir, qui manipule les pièces et doit savoir laquelle est disponible, laquelle est promise, laquelle est partie.

### Content

Un article peut être à fondre, en stock, réservé, en dépôt-vente, en réparation, vendu, rendu au client ou fondu. La fiche résume ce cheminement en trois étapes : « Entrée » (Rachat ou dépôt-vente), « En stock » (Disponible en boutique) et « Sortie » (Vendu ou rendu). Un article en stock, réservé, en dépôt-vente ou en réparation se tient à l'étape « En stock » ; un article vendu ou rendu au client à l'étape « Sortie » ; un article à fondre ou déjà fondu n'a franchi aucune des trois. Depuis la fiche, un article en stock peut être envoyé en fonderie, et un article à fondre peut être remis en stock.

## Notes techniques

`bijoux_stock.statut` est contraint par `bijoux_stock_statut_check` aux huit valeurs `en_stock`, `vendu`, `reserve`, `en_depot_vente`, `rendu_client`, `en_reparation`, `fondu`, `a_fondre` (migrations `017_stock_depot_vente_columns.sql`, `047_create_reparations.sql`, `049_create_bons_livraison.sql`, `051_bijoux_stock_a_fondre.sql`).

`src/components/stock/stock-lifecycle-stepper.tsx` reduit ces huit valeurs a trois etapes via `computeStep` : `en_stock|reserve|en_depot_vente|en_reparation` renvoient 1, `vendu|rendu_client` renvoient 2, le `default` (donc `a_fondre` et `fondu`) renvoie 0. `isError` vaut vrai sur le seul `rendu_client` et bascule le cercle et le libelle en ambre (`bg-amber-500/10 text-amber-600 ring-amber-500/20`), conformement a R-032.

Les deux bascules manuelles sont dans `stock-detail-page.tsx:211-253` : bouton « Envoyer en fonderie » sur `en_stock` (update `statut = 'a_fondre'`, toast « Stock mis à jour ») et bouton « Remettre en stock » sur `a_fondre` (update `statut = 'en_stock'`, toast « Article remis en stock »). Les autres transitions sont pilotees par les dialogues de reparation, le picker de vente, la restitution de depot-vente et la reception des bons de livraison.
