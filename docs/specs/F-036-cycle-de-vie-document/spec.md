---
id: F-036
slug: cycle-de-vie-document
title: Suivre le cycle de vie d'un document, de l'émission au règlement
epic: E-013
surface: risquee
domaine: [DOM-012, DOM-013]
dependencies: [F-035, F-038]
personas: [PER-002, PER-001]
---

# Objectif

Chaque pièce émise porte un état qui dit où en est l'engagement qu'elle contient, de l'émission à l'acceptation, au refus, à la signature, au règlement ou à l'annulation. Une pièce devient réglée dès que les versements qui lui sont rattachés couvrent son montant.

## Intention

Une pièce sans état est un papier mort : rien ne dit si le devis a reçu une réponse, si le contrat a été signé, si la facture a été payée. Le comptoir se retrouve alors à rouvrir les dossiers un par un pour savoir ce qui reste à faire, et à relancer un client qui a déjà réglé.

L'état donne à la pièce sa fonction de mémoire. Le propriétaire ouvre l'application le matin et voit ce qui appelle une action : les devis restés sans réponse, les factures encore ouvertes, les contrats en attente de signature. Le vendeur, lui, sait au moment de recevoir un client ce qui a déjà été accepté et ce qui a déjà été payé.

Ces états sont lus en balayant des listes toute la journée, pas en lisant chaque libellé. Chaque état porte donc la même couleur d'un écran à l'autre, sans quoi la lecture rapide devient un piège.

Rattacher l'argent à la pièce plutôt qu'au lot change enfin la nature du suivi : le reste dû se calcule pièce par pièce, ce qui permet de dire exactement quelle facture est soldée et laquelle ne l'est pas, même quand plusieurs pièces couvrent la même opération.

## Hors-scope

- la fabrication de la pièce et sa numérotation, faites à l'émission
- la saisie du règlement lui-même, ses moyens de paiement et son sens, tenue par le périmètre des règlements
- les états des lots, des dossiers et des bons de commande, qui suivent leurs propres chemins

## Cas d'erreur

- un second règlement arrive sur une pièce déjà au statut « Réglé » : l'état n'est pas réécrit et la pièce reste réglée une seule fois
- le versement enregistré ne couvre pas le montant attendu : la pièce conserve son état précédent, et le reste dû affiché est celui de cette pièce, pas celui du lot entier

## Brief produit

### Purpose

Donner à chaque pièce un état lisible et stable, qui dit sans ambiguïté où en est l'engagement qu'elle porte et ce qu'il reste à encaisser dessus.

### User

Le vendeur au comptoir, qui doit savoir en recevant un client ce qui a été accepté, signé et payé. Le propriétaire, qui pilote la journée sur ces états. Le client particulier, dont l'engagement et le paiement sont exactement ce que ces états consignent.

### Content

Sept états, affichés partout avec le même libellé et la même couleur : En attente (ambre), Accepté (vert), Refusé (rouge), Signé (bleu), Réglé (vert), Émis (gris), Annulé (rouge).

Les passages constatés : un devis passe à Accepté ou à Refusé à la réponse du client ; un contrat de rachat, un contrat de dépôt-vente et un confié d'achat passent à Signé à la finalisation ou à l'expiration du délai ; les quittances de dépôt-vente et les bons naissent Émis ; une facture ou une quittance passe à Réglé dès qu'un versement couvre son montant ; un contrat de rachat passe à Annulé lors d'un remboursement après rétractation ; un confié d'achat passe à Annulé à la restitution.

Chaque pièce est rattachée aux lignes de l'opération qu'elle couvre, ce qui permet de calculer le reste dû par pièce et de savoir quelle quittance émettre pour quel contrat.

## Notes techniques

`documents.status` porte les sept valeurs (`supabase/migrations/064_add_document_status.sql`, `annule` ajouté par `118_add_document_status_annule.sql`). Libellés et classes de couleur dans `STATUS_CONFIG` de `src/components/documents/documents-table.tsx` (R-032). Le passage à `regle` est écrit par `src/components/reglements/reglement-dialog.tsx:120-126` : `update({status:'regle'}).eq('id', document_id).neq('status','regle')`, sous la condition `newTotal >= montant_attendu - 0.01`. La jonction `document_references` (`065_create_document_references.sql`) relie chaque document aux `lot_references` qu'il couvre et alimente `detectPaymentsDue`. `reglements.document_id` (`066_add_document_id_to_reglements.sql`) rattache chaque mouvement d'argent à sa pièce, avec un backfill rétroactif par appariement type de règlement vers type de document. La lecture des pièces reste soumise au bucket privé `documents` (R-025).
