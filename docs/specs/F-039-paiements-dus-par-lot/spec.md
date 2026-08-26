---
id: F-039
slug: paiements-dus-par-lot
title: Faire remonter les paiements dus sur le tableau de bord de chaque lot
epic: E-014
surface: risquee
domaine: [DOM-004, DOM-012, DOM-013]
dependencies: [F-036, F-038]
personas: [PER-002, PER-001]
---

# Objectif

Chaque opération dit d'elle-même ce qui reste à encaisser ou à verser, pièce par pièce, sans que personne ait à faire la soustraction. Ce qui reste dû remonte en action urgente là où l'opérateur travaille, sur le lot et sur le tableau de bord du jour.

## Intention

Le reste dû est une information que tout le monde connaît mal et au mauvais moment. Le vendeur qui ouvre un lot voit un montant total et une liste de pièces, mais pas la réponse à la seule question qui compte devant le client : combien lui doit-on encore aujourd'hui, sur quelle quittance. Le propriétaire, lui, découvre les paiements oubliés quand un client rappelle.

Faire calculer ce reste par l'application et l'afficher comme une action à faire déplace l'effort. Le vendeur n'a plus à retrouver la pièce, à relire les règlements déjà saisis et à soustraire : il lit un libellé qui nomme la pièce concernée et un restant, et la saisie du règlement part déjà remplie de ce montant. Le propriétaire ouvre son tableau de bord le matin et voit la totalité de ce qui attend d'être encaissé ou versé, tous lots confondus.

L'effet recherché est qu'un paiement en attente cesse d'être une chose dont on se souvient, pour devenir une chose qu'on voit, et qui disparaît d'elle-même une fois faite.

## Hors-scope

- l'enregistrement du règlement lui-même, sa validation et sa suppression
- le calcul du montant attendu, qui vient du chiffrage et des pièces émises : ce périmètre soustrait, il ne fixe pas de prix
- la relance du client ou de la fonderie, par courrier, message ou téléphone

## Cas d'erreur

- le bon de commande fonderie est annulé ou déjà payé : plus aucun paiement fonderie ne remonte pour lui, et la ligne disparaît des actions du lot
- l'acompte d'une vente d'or d'investissement n'est pas entièrement encaissé : le solde ne remonte pas encore, et l'opérateur qui le cherche ne le trouvera qu'une fois l'acompte soldé

## Brief produit

### Purpose

Transformer le reste dû, aujourd'hui reconstitué de tête, en une action nommée, chiffrée et cliquable, présentée à l'endroit où le travail se fait.

### User

Le vendeur au comptoir, qui doit savoir devant le client ce qui lui reste à verser ou à encaisser. Le propriétaire, qui veut la vue de tous les paiements en attente du comptoir sans ouvrir les lots un par un.

### Content

Chaque paiement dû porte un libellé qui nomme la pièce concernée (« Quittance QRA-2026-0042 | Paiement client à effectuer », « Facture FVE-2026-0018 | Encaissement client », « Quittance QDV-2026-0005 | Net déposant à verser », « Bon de commande BDC-2026-0007 | Paiement fonderie à effectuer »), une description courte, et le restant sous la forme « Restant : 1 350,00 € ». Les cas couverts sont le rachat par quittance, le rachat anticipé pendant la rétractation, le rachat finalisé, la vente de bijoux, l'acompte puis le solde d'or d'investissement, le net déposant et la fonderie.

Sur le tableau de bord général, les mêmes paiements apparaissent sous des libellés courts (« Acompte client à encaisser (10%) », « Solde client à encaisser (90%) », « Règlement rachat à verser au client », « Paiement vente à encaisser »), avec pour sous-titre le montant, le lot et le client.

## Notes techniques

`src/lib/reglements/detect-payments-due.ts` produit, pour un lot, la liste des `PaymentDue` : `label`, `description`, `montant_attendu`, `montant_deja_paye`, `montant_restant`, `is_fully_paid` et un `pre_fill` qui pré-remplit le dialogue de règlement (type, sens, montant, `client_id`, `fonderie_id`, `bon_commande_id`, `document_id`). Le montant attendu d'une quittance vient des références qui lui sont liées par `document_references` (`065_*.sql`), filtrées sur `en_attente_paiement` ; le déjà payé vient des règlements portant le même `document_id`.

Le taux d'acompte est le paramètre `acompte_pct`, par défaut 10 : le solde n'est poussé que si `acompteRestant < 0.01`. Un bon de commande de statut `annule` ou `paye` est ignoré (`detect-payments-due.ts:330`). Le seuil de solde est partout `< 0.01`.

`src/lib/actions/action-registry.ts:283-304` transforme chaque `PaymentDue` non soldé en action de catégorie `payment`, priorité `urgent`, icône Money, description `Restant : {montant}`. Rendu par `lot-actions-card.tsx`, `action-dashboard.tsx`, `action-list.tsx` et, côté vue du jour, `dashboard-alerts-server.tsx` avec la table `PAIEMENT_LABELS` de `dashboard-alerts.tsx:105`.
