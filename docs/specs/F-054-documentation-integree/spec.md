---
id: F-054
slug: documentation-integree
title: Guider l'utilisateur avec un mode d'emploi intégré à l'application
epic: E-018
surface: standard
dependencies: none
personas: [PER-002, PER-001]
---

# Objectif

Un mode d'emploi consultable depuis l'application, organisé en onze fiches réparties sur trois catégories : les procédures du métier, les écrans de l'application et la configuration. Chaque fiche se lit en étapes numérotées et renvoie vers l'écran qu'elle décrit.

## Intention

Une reprise de comptoir, un remplacement, un geste qu'on ne fait qu'une fois par mois : à chacun de ces moments, la marche à suivre manque et personne n'a le temps de la chercher dans un classeur. La question part alors au propriétaire, souvent en plein rendez-vous client.

Le mode d'emploi vit donc dans l'application, à jour du vocabulaire réel des écrans, et se lit dans l'ordre où le geste se fait. Il ne décrit pas des fonctions mais des parcours : effectuer un rachat, réaliser une vente, créer un dépôt-vente.

Le lien vers l'écran concerné compte autant que le texte : la fiche reste ouverte pendant qu'on essaie, plutôt que d'obliger à mémoriser puis à revenir.

## Hors-scope

- la recherche plein texte dans l'aide : on y navigue par catégorie et par fiche
- les illustrations photographiques : les écrans sont représentés par des maquettes décrites, pas par des captures
- l'aide contextuelle incrustée dans l'écran de travail, qui ouvrirait la bonne fiche au bon moment
- la rédaction de l'aide par l'utilisateur : le catalogue est livré avec l'application

## Cas d'erreur

- la procédure cherchée ne figure pas parmi les onze fiches publiées : le catalogue n'affiche rien à ce sujet et ne renvoie vers aucune autre forme d'aide
- l'écran fait moins de 768 points de large : la colonne de navigation des catégories disparaît et les fiches ne s'atteignent plus qu'en faisant défiler la page

## Brief produit

### Purpose

Répondre sur place à « comment on fait déjà ? », dans le vocabulaire des écrans, sans mobiliser quelqu'un d'autre.

### User

Le vendeur au comptoir, en particulier lors de ses premières semaines ou sur un geste rare. Le propriétaire, qui cesse d'être le seul dépositaire des procédures.

### Content

Trois catégories. « Procédures » couvre ajouter un client, créer un dossier, effectuer un rachat, réaliser une vente, les bons de commande et créer un dépôt-vente. « Pages » couvre les paramètres, le stock de bijoux, l'or d'investissement et les fonderies. « Configuration » couvre les notifications par courriel.

Chaque fiche se découpe en étapes titrées. Le rachat en compte six, de « Créer le lot de rachat » à « Répondre à un devis », en passant par « Ajouter les références », « Enregistrer et finaliser », « Période de rétractation » et « Finaliser le rachat ». La vente en compte sept, de « Créer le lot de vente » à « Annuler une vente ».

Une colonne de navigation à gauche liste catégories, fiches et étapes, suit la lecture au défilement et permet d'atteindre directement un point précis. Depuis une étape, un lien coloré et souligné mène à l'écran décrit dans un nouvel onglet.

## Notes techniques

La page est servie sur `/documentation` en pleine hauteur sans marge (`src/app/(dashboard)/documentation/page.tsx`). Le catalogue est un tableau statique de JSX dans `src/components/documentation/doc-categories.tsx`, environ 1 049 lignes ; aucune donnée du produit n'est lue.

`DocumentationPage` construit la liste plate des sections et de leurs étapes, suit la position de lecture par un `IntersectionObserver` sur `[data-doc-section]` (`rootMargin: "-10% 0px -80% 0px"`) et fait défiler en douceur au clic, avec un verrou de 800 ms pour ne pas se battre avec l'observateur.

La colonne de navigation est en `hidden md:flex`, donc absente sous le point de rupture `md`. `AppLink` (`doc-app-link.tsx`) pose `target="_blank"` et porte sa couleur en permanence, correction issue de la recette où les seuls éléments colorés de l'aide étaient des badges de statut non cliquables.
