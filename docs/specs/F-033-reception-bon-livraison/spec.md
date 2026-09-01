---
id: F-033
slug: reception-bon-livraison
title: Réceptionner un bon de livraison et constater les écarts de poids ou de titre
epic: E-011
domaine: [DOM-014, DOM-015]
surface: standard
dependencies: [F-031]
personas: [PER-001, PER-005]
---

# Objectif

Le fondeur retient son propre poids et son propre titre : l'écart avec ce que la maison avait annoncé se mesure, se commente et se conserve. C'est cette pièce, et elle seule, qui permet de discuter un règlement.

## Intention

Un lot part avec un poids et un titre annoncés par le comptoir, il revient avec un poids et un titre retenus par l'affineur. Les deux ne coïncident presque jamais. Sans trace, la discussion se réduit à un souvenir contre une facture, et la maison finit par accepter ce qu'on lui présente.

La réception donne à cette différence un statut de fait établi. Chaque article se reçoit avec ce que le fondeur a mesuré, la valeur correspondante se recalcule sur la même base de cours que l'annonce de départ, et la différence s'affiche telle quelle, en euros, favorable ou défavorable. Une note libre permet d'y accrocher ce que le fondeur a expliqué.

Ce constat sert trois fois : il fonde le règlement du partenaire, il permet de comparer les fondeurs entre eux sur la durée, et il renvoie au comptoir un jugement sur la justesse de son expertise. Pour cela il doit être stable, donc une fois validé il ne se retouche plus.

## Hors-scope

- la décision de ce qui est parti chez ce partenaire et sur quelle base de valorisation, qui appartient au routage
- le règlement du partenaire et ses suites comptables, qui se traitent sur les mouvements d'argent une fois l'écart figé
- la contestation de l'écart auprès du fondeur, qui se mène hors de l'application : ici on l'établit et on le conserve

## Cas d'erreur

- le bon a déjà été traité : les résultats du fondeur restent affichés en entier mais aucune valeur n'est modifiable, et seule la fermeture est proposée

## Brief produit

### Purpose

Établir sans discussion possible la différence entre ce que la maison a annoncé et ce que l'affineur a retenu, et la garder attachée au bon qui l'a produite.

### User

Le propriétaire du comptoir, qui reçoit la marchandise revenue et arbitre le règlement. La fonderie partenaire, dont les mesures font foi et dont la réputation se construit sur la répétition de ces écarts.

### Content

Un bon de livraison porte un numéro de la forme BDL-2026-0001, une fonderie, un statut parmi Brouillon, Envoyé, Reçu, Traité et Annulé, un poids total et une valeur annoncée.

Chaque ligne garde l'instantané pris au départ : désignation, métal, titre déclaré, poids déclaré, cours retenu, valeur estimée. Elle reçoit ensuite ce que le fondeur a retenu : titre réel, poids réel, valeur réelle, notes, et la date de l'essai.

Le relevé des résultats se lit en sept colonnes : Référence, Titrage déclaré, Titrage réel, Poids déclaré, Poids réel, Écart valeur, Notes. L'écart s'affiche en euros, signé, et les lignes dont le titre ou le poids diffèrent de l'annonce sont signalées comme telles.

## Notes techniques

La valeur réelle remonte au cours de base plutôt que de réutiliser le cours au titre déclaré : `coursBase = cours_utilise / (titrage_declare/1000)` puis `valeurReelle = round(poids_reel x coursBase x titrage_reel/1000, 2)`, l'écart valant `valeurReelle - valeur_estimee` (`ecart-dialog.tsx:75-88`). Le cours porté par la ligne est celui figé à l'envoi, à l'échelle élargie par R-019. Les drapeaux `ecart_titrage` et `ecart_poids` sont posés dès que la valeur retenue diffère de la déclarée. `poids_total` et `valeur_estimee` du bon sont tenus par `bon_livraison_lignes_totals` (049_create_bons_livraison.sql), conformément à R-044. La sauvegarde pose `statut = 'traite'` et `date_traitement`, et `readOnly` en découle. L'annulation d'un bon repasse les `bijoux_stock` liés en `en_stock`.
