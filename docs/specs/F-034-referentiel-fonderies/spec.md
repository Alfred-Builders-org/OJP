---
id: F-034
slug: referentiel-fonderies
title: Tenir le référentiel des fonderies partenaires
epic: E-012
domaine: [DOM-014]
surface: standard
dependencies: none
personas: [PER-001]
---

# Objectif

Tenir la liste des affineurs avec qui la maison travaille et les coordonnées pour les joindre : tant qu'un partenaire n'y figure pas, rien ne peut lui être adressé. Cette liste est tenue par le propriétaire seul.

## Intention

Un partenaire de fonte n'existe, pour la maison, que parce que quelqu'un l'a déclaré. Sans cet endroit unique, son nom se retrouve écrit à la main sur chaque bon, avec une adresse qui date, un numéro qui a changé, et deux orthographes du même fondeur qui empêchent de rassembler son historique.

Le référentiel supprime cette dispersion. Une fiche par partenaire, saisie une fois, reprise partout où la question du destinataire se pose. Sous la fiche s'accumule ce qui lui a été adressé, ce qui en fait le seul endroit où l'on peut regarder un fondeur dans la durée plutôt qu'affaire par affaire.

C'est aussi un point de pouvoir, et il est gardé comme tel : ajouter un partenaire, c'est ouvrir une porte par laquelle de la marchandise sort de la maison. Le vendeur au comptoir n'y accède pas, ni à la liste ni aux fiches.

## Hors-scope

- les métaux traités par chaque affineur et les conditions consenties, taux de rendement, délai de paiement ou frais : le référentiel dit qui est le partenaire et où le joindre, les termes commerciaux se négocient hors de l'application
- la proposition automatique d'un destinataire selon le métal du lot : le choix reste un arbitrage humain au moment de router
- ce qui est adressé au partenaire et ce qu'il renvoie, qui appartiennent aux deux étapes qui entourent le référentiel et qui viennent y lire

## Cas d'erreur

- le nom est laissé vide à l'enregistrement : la fiche n'est pas créée et le message « Le nom est obligatoire » est affiché
- un vendeur au comptoir demande la liste des fonderies : la page ne s'ouvre pas, et l'entrée de menu ne lui est de toute façon pas proposée

## Brief produit

### Purpose

Faire exister un partenaire à un seul endroit, avec des coordonnées à jour, pour que tout ce qui lui est adressé parte du même nom et se retrouve sous la même fiche.

### User

Le propriétaire du comptoir, seul à voir et à tenir cette liste. La fonderie partenaire, dont la fiche porte les coordonnées auxquelles les bons lui parviennent.

### Content

Une fiche porte un nom, une adresse, un code postal, une ville, un téléphone, un email et des notes libres. Le nom est le seul champ exigé : sans lui l'enregistrement est refusé.

Trois partenaires sont présents dès l'ouverture : CPoR Devises, Comptoir National de l'Or et Gold by Gold.

La fiche d'un partenaire montre ses coordonnées et l'historique des bons qui lui ont été adressés.

## Notes techniques

La table `fonderies` (029_create_fonderies.sql) ne porte que `nom`, `adresse`, `code_postal`, `ville`, `telephone`, `email`, `notes` : aucune colonne pour les métaux traités ni les conditions, ce qui explique le hors-scope. Les quatre politiques `fonderies_select/insert/update/delete` (040_rbac_rls_policies.sql) exigent `user_role() = 'proprietaire'`, et le filtrage de menu et de route n'est qu'un second rideau (R-028). Les trois partenaires initiaux sont insérés par la migration 029 elle-même.
