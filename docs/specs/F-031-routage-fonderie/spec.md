---
id: F-031
slug: routage-fonderie
title: Router vers les fonderies les lots destinés à la fonte
epic: E-010
domaine: [DOM-006, DOM-014, DOM-015]
surface: standard
dependencies: [F-017, F-034]
personas: [PER-001, PER-005]
---

# Objectif

Répartir les références à fondre entre le stock disponible et les fonderies partenaires, en une décision unique et tracée. Ce partage commande tout ce qui sort de la maison vers un affineur.

## Intention

Avant, la décision se prenait de tête : le propriétaire regardait ce qu'il avait en réserve, devinait ce qu'il fallait commander, et notait à part chez qui. Rien ne reliait la quantité vendue à ce qui allait réellement la servir, si bien qu'une pièce pouvait être promise deux fois, une fois sur le disponible et une fois chez un fondeur.

Le routage réunit les deux gestes au même endroit. Pour chaque référence attendue, on voit ce que le stock peut absorber, on affecte le reste à un ou plusieurs partenaires, et la répartition n'est acceptée que si elle couvre exactement la quantité due. Ce que le stock sert en sort immédiatement ; ce qui part en fonderie devient une commande adressée.

Le même écran porte le second sens du mot fonte : les bijoux repris qui ne se revendront pas en l'état sont sélectionnés dans la réserve, valorisés au cours du jour, et regroupés dans un bon de livraison remis au partenaire. La maison sait donc, en un point, ce qui part, chez qui, et pour quelle valeur annoncée.

## Hors-scope

- le choix du partenaire selon le métal qu'il traite ou les conditions consenties : l'écran propose tout le référentiel et laisse le propriétaire trancher
- ce qui revient du fondeur, le poids et le titre qu'il retient, les écarts qui en découlent : ici la marchandise sort, elle ne rentre pas
- le règlement du partenaire, qui se suit sur le bon adressé et non sur la décision de répartition

## Cas d'erreur

- la répartition ne couvre pas toute la quantité de la ligne : le compteur affiche « Total dispatché 3 / 5 » et la confirmation reste indisponible tant que le compte n'y est pas
- l'envoi en fonte est demandé sans fonderie destinataire ou sans aucun article coché : la création du bon de livraison reste indisponible

## Brief produit

### Purpose

Faire tenir en une seule décision le partage d'une quantité due entre ce que la maison a déjà et ce qu'elle doit faire venir, sans qu'aucune part ne se perde ni ne se compte deux fois.

### User

Le propriétaire du comptoir, seul habilité à engager la marchandise vers un partenaire. La fonderie partenaire, destinataire de ce que la répartition lui adresse.

### Content

Deux entrées. La première liste les références attendues avec leur désignation, leur lot, le client, la quantité, le prix, le stock disponible et la destination retenue ; un compteur annonce combien de lignes restent à trancher. La seconde liste les bijoux repris encore en réserve, filtrables par métal, avec leur poids et leur métal, et le total de ce qui est coché.

La répartition d'une ligne se fait dans un panneau qui rappelle la quantité à dispatcher et le stock disponible, accepte autant de destinations que voulu, et affiche en permanence le total affecté sur le total dû.

Le bon de livraison remis au partenaire valorise chaque article au cours du jour du métal, corrigé de son titre, et regroupe les articles par métal et par titre avec un sous-total en pièces, en poids et en valeur.

## Notes techniques

L'écran est réservé au propriétaire, `/commandes` et `/envois` y redirigent. La décrémentation du stock d'un produit d'investissement passe par `increment_or_invest_quantite`, qui refuse le passage sous zéro avant que la contrainte ne se déclenche (R-021). `create-bon-livraison.ts` relit les cours dans `parametres` à chaque création, calcule `cours_gramme = cours_metal x titrage/1000` puis `valeur = poids_net x cours_gramme`, et pose les articles retenus en statut `fondu`. Le regroupement par couple métal + titrage n'existe que dans le PDF, il n'est pas persisté.
