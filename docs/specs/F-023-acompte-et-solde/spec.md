---
id: F-023
slug: acompte-et-solde
title: Encaisser un acompte et annuler la vente si le solde n'arrive pas à temps
epic: E-008
domaine: [DOM-009, DOM-012, DOM-013]
surface: risquee
dependencies: [F-022, F-038]
personas: [PER-002, PER-004]
---

# Objectif

Une vente d'or d'investissement se réserve contre un acompte, et le reste du prix est attendu avant une échéance annoncée au client. Passé ce délai sans règlement du solde, la commande est annulée et les articles retournent à l'origine d'où ils venaient.

## Intention

Quand un client commande un produit d'investissement, le comptoir doit sortir l'article du disponible, ou le commander à une fonderie, avant d'avoir vu la couleur de l'argent. Sans acompte, c'est le comptoir qui porte le risque ; sans échéance, un article reste immobilisé indéfiniment sur une commande que personne n'honore, et il n'est plus vendable à quelqu'un d'autre.

L'acompte règle la première moitié du problème : le client engage une part du prix, le comptoir engage l'article. L'échéance règle la seconde : le client sait à quelle date le solde est attendu, le vendeur voit le compte à rebours sur la fiche, et une commande abandonnée se referme d'elle-même au lieu de rester en travers du stock.

La part demandée en acompte n'est pas une constante du métier : c'est un réglage du comptoir, que le propriétaire ajuste dans les paramètres sans dépendre de personne.

## Hors-scope

- l'enregistrement du mouvement d'argent lui-même, qui se fait au parcours des règlements
- la mise en forme des factures d'acompte et de solde, qui relève de l'émission des pièces contractuelles
- la vente réglée en une seule fois, qui ne connaît ni acompte ni échéance de solde
- le remboursement de l'acompte quand la commande est annulée, qui s'enregistre comme un règlement négatif

## Cas d'erreur

- le solde est présenté à l'encaissement avant l'acompte : tant que l'acompte n'est pas réglé, la liste des paiements dus ne propose que l'acompte
- la date limite est franchie sans règlement du solde : la fiche annonce l'expiration du délai et prévient que la commande sera annulée automatiquement, ses articles revenant en stock ou en dépôt-vente

## Brief produit

### Purpose

Réserver un article contre une part du prix, borner l'attente du reste par une date, et refermer la commande que le client n'honore pas.

### User

Le vendeur au comptoir, qui annonce l'acompte au client, l'encaisse, et surveille l'échéance du solde. Le client particulier, qui verse l'acompte, reçoit ses deux factures et connaît la date à laquelle le reste est attendu. Le propriétaire, qui décide de la part demandée en acompte.

### Content

Sur la vente : le montant de l'acompte, le montant du solde, la date limite de règlement du solde, et l'état de chacun des deux. Sur la fiche : la mention de l'acompte encaissé, puis, une fois l'échéance franchie, l'avertissement que la commande sera annulée. Dans les paiements dus : la ligne d'acompte, puis la ligne de solde une fois l'acompte réglé.

## Notes techniques

`processVenteLot` (`src/lib/actions/finalize-actions.ts`) lit `business_rules.acompte_pct` (défaut 10), calcule `montantAcompte = round(totalTTC * acompte_pct / 100, 2)` et `montantSolde = totalTTC - montantAcompte`, génère une facture d'acompte (FAC) et une facture de solde (FSO, dont `reference_numero` porte le numéro d'acompte), puis écrit `acompte_montant` et `date_limite_solde` sur le lot.

Deux écarts connus, à traiter en delta et non ici. Premièrement, `date_limite_solde = now() + 48 h` est une constante en dur : le seuil `solde_delai_heures` des paramètres n'est pas lu, alors que R-024 le compte parmi les treize seuils réglables. Deuxièmement, `cancel_expired_acompte_lots()` (migration `027_auto_cancel_expired_acompte.sql`) existe mais son ordonnancement n'est pas posé par la migration (un commentaire renvoie à `cron.schedule('cancel-expired-acompte', '*/15 * * * *', ...)`), et la fonction cible `status = 'en_cours'` pour écrire `status = 'annule'`, valeur que le CHECK de la migration 081 n'autorise plus (le couple attendu est désormais `status = 'finalise'` avec `outcome = 'annule'`). L'annulation automatique n'est donc pas effective en l'état.

La proposition d'encaissement vit dans `src/lib/reglements/detect-payments-due.ts:244-283` ; l'affichage de la fiche dans `src/components/ventes/vente-detail-page.tsx:249-271` ; le réglage de la part d'acompte dans `src/components/parametres/regles-metier-tab.tsx`.
