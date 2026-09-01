---
id: F-042
slug: snapshot-des-cours
title: Figer le cours utilisé sur chaque opération pour rendre les calculs rejouables
epic: E-015
domaine: [DOM-004, DOM-005, DOM-016]
surface: risquee
dependencies: [F-040]
personas: [PER-002, PER-001]
---

# Objectif

Le cours du jour est copié sur le lot et sur chaque référence : un recalcul six mois plus tard donne le même chiffre. Le prix annoncé au client au comptoir reste donc explicable longtemps après son départ.

## Intention

Un prix de rachat n'est pas une opinion : c'est un engagement pris devant un client, souvent suivi d'un délai de rétractation, d'un devis, d'une finalisation et parfois d'un litige. Si le chiffre se recalcule chaque fois qu'on ouvre la fiche, il change au gré du marché, et plus personne ne peut expliquer pourquoi le client a été payé ce qu'il a été payé.

La feature répond en gravant le cours au moment où l'opération s'ouvre. Le lot emporte les cours des trois métaux et les coefficients du jour ; chaque référence saisie emporte en plus le cours du métal qui la concerne. Le formulaire de saisie ne regarde jamais les cours courants : il lit ce que le lot a figé. Le vendeur peut donc reprendre un lot le lendemain sans que les prix bougent sous ses yeux, et le propriétaire peut rejouer un calcul des mois plus tard et retrouver le centime près.

L'affichage suit la même exigence : la fiche du lot montre une ligne « Cours appliqués » marquée « figés à la création », pour que personne ne confonde le cours d'un dossier avec le cours d'aujourd'hui. Et parce que le fondeur reçoit ensuite ces lots, la ligne de bon de livraison fige elle aussi le cours retenu : à la réception, l'écart entre le poids annoncé et le poids réel se valorise sur la même base que le rachat.

## Hors-scope

- le relevé des cours et son rythme, qui appartiennent à F-040
- le refus d'un cours aberrant, qui appartient à F-041
- les formules de prix elles-mêmes, dont le cours n'est qu'un facteur parmi le titre, le poids et le coefficient
- la modification d'un cours déjà figé sur un lot : elle n'est pas offerte, hors le rattrapage d'un lot ouvert sans aucun cours

## Cas d'erreur

- un lot a été créé alors qu'aucun cours n'était relevé : sa fiche annonce qu'aucun cours n'est associé au lot et que les prix proposés seront à zéro, et invite à renseigner les cours puis à créer un nouveau lot
- un lot ainsi vide est repris dans le formulaire d'or d'investissement : les cours courants y sont recopiés sur le lot, ce qui remplace les cours d'origine et fausserait un lot ancien rouvert par erreur

## Brief produit

### Purpose

Rendre tout prix du comptoir rejouable : la même référence, relue plus tard, redonne le même montant parce que le cours qui l'a produite est conservé avec elle.

### User

Le vendeur au comptoir, qui reprend un lot d'un jour à l'autre sans voir les prix bouger. Le propriétaire, qui doit pouvoir justifier un paiement passé et rapprocher un retour de fonderie du chiffrage d'origine.

### Content

Le lot porte les cours de l'or, de l'argent et du platine du jour de sa création, plus les coefficients de rachat et de vente en vigueur ce jour-là. Chaque référence du lot porte le cours du métal qui la concerne et le coefficient qui lui a été appliqué. La ligne de bon de livraison porte le cours retenu au titrage déclaré. Tous ces cours se portent au millième d'euro.

### Flow

À la création du lot, les cours et coefficients du jour y sont recopiés. À chaque référence saisie, le cours du métal choisi est repris depuis le lot et non depuis les paramètres. La fiche du lot affiche « Cours appliqués » avec la mention « figés à la création ». Au routage vers la fonderie, le cours passe sur la ligne du bon de livraison, où la réception le retrouve.

## Notes techniques

Les instantanés vivent sur `lots` (`cours_or_snapshot`, `cours_argent_snapshot`, `cours_platine_snapshot`, `coefficient_rachat_snapshot`, `coefficient_vente_snapshot`, migration 009) et sur `lot_references` (`cours_metal_utilise`, `coefficient_utilise`). La sélection du bon cours passe par `getCoursMetalFromSnapshot(metal, coursOrSnapshot, coursArgentSnapshot, coursPlatineSnapshot)` dans `src/lib/calculations/prix-rachat.ts`, appelée par `reference-form-bijoux.tsx` et `reference-form-or-invest.tsx`. `create-bon-livraison.ts` reporte `cours_utilise` sur `bon_livraison_lignes`. La migration 130 élargit toute la chaîne en `NUMERIC(10,3)`, ce que R-019 exige. Le rattrapage des lots à zéro se trouve dans `reference-form-or-invest.tsx` (relecture de `parametres` puis mise à jour des colonnes d'instantané du lot) : il n'est déclenché que lorsque les instantanés or et argent valent tous deux 0.
