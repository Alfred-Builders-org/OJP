---
id: F-016
slug: assiette-taxable-periode
title: Restituer l'assiette taxable de la période pour la déclaration
epic: E-005
surface: risquee
domaine: [DOM-005, DOM-009]
dependencies: [F-014]
personas: [PER-001]
---

# Objectif

Réunir sur un seul écran toutes les taxes constatées par le comptoir, celles des rachats finalisés comme celles des ventes, pour préparer la déclaration. L'écran est réservé au propriétaire.

## Intention

Jusqu'ici, retrouver ce qu'il fallait déclarer demandait de rouvrir les lots un par un et de reprendre les factures de vente à côté : deux sources, deux logiques, aucune vue commune. Le propriétaire recopiait, et une ligne oubliée ne se voyait qu'au contrôle.

L'écran des impôts réunit les deux : la taxe portée par chaque objet racheté, quel que soit son régime, et la taxe sur la marge des ventes. Chaque ligne dit sa date, sa référence, son client, son régime, le montant brut et la taxe, et renvoie d'un clic au dossier d'origine, pour que le propriétaire puisse vérifier un chiffre au lieu de le croire.

La restriction au seul propriétaire n'est pas cosmétique : l'écran donne le chiffre d'affaires taxable de la maison, qui n'a pas à circuler au comptoir.

## Hors-scope

- le calcul du montant de chaque taxe, arrêté au moment du chiffrage de l'objet ou de l'émission de la facture
- les lots encore en brouillon, dont la taxe est provisoire tant que l'opération n'est pas finalisée
- la déclaration elle-même et le reversement à l'administration, qui se font hors de l'application

## Cas d'erreur

- un lot encore en brouillon porte déjà une taxe chiffrée : il est écarté de l'assiette, parce que son montant peut encore changer
- le filtre de régime retenu ne laisse aucune ligne : le tableau reste vide et affiche « Aucune taxe trouvée. »

## Brief produit

### Purpose

Donner au propriétaire, en un écran, le chiffre qu'il devra déclarer, avec le chemin de retour vers chaque opération qui le compose.

### User

Le propriétaire du comptoir, seul habilité à voir cet écran, qui répond de la fiscalité de la maison et prépare ses déclarations.

### Content

Un tableau de six colonnes triables : la date, la référence de l'opération, le client, le régime, le montant brut et la taxe. Les rachats y figurent sous leur régime (métaux précieux, objets précieux ou plus-value), les ventes sous celui de la taxe sur la valeur ajoutée. Une recherche libre porte sur la référence ou le client, et quatre cases filtrent par régime : « TMP (Métaux Précieux) », « TFOP (Objets Précieux) », « TPV (Plus-Value) » et « TVA (Ventes) ». Chaque ligne ramène à l'opération dont elle provient.

## Notes techniques

`src/app/(dashboard)/impots/page.tsx` agrège deux sélections : les `lot_references` dont `regime_fiscal` n'est pas nul et `montant_taxe` strictement positif, écartées si `lot.status` vaut `brouillon` et datées de `lot.date_finalisation`, et les `factures` dont `montant_taxe` est strictement positif, datées de `date_emission`. Le rendu vit dans `impots-table.tsx`, `impots-toolbar.tsx` et `taxe-type-badge.tsx`, l'entrée de menu dans `sidebar-nav.tsx`, groupe Comptabilité, restreinte au rôle propriétaire. Le tri par défaut est la date décroissante.

Manquent à ce jour, et donc non couverts par les critères : le sélecteur de période (mois, trimestre, exercice), les totaux et sous-totaux, et l'export.
