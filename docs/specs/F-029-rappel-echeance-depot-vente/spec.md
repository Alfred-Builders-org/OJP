---
id: F-029
slug: rappel-echeance-depot-vente
title: Rappeler l'échéance d'un contrat de dépôt-vente resté invendu
epic: E-009
surface: standard
domaine: [DOM-010]
dependencies: [F-026, F-053]
personas: [PER-001, PER-004]
---

# Objectif

Un contrat de dépôt-vente arrivé à son terme sans que les articles soient partis doit être signalé au comptoir. Aujourd'hui ce signalement ne part jamais, faute de terme enregistré et de relance programmée.

## Intention

Un dépôt-vente est un contrat à durée déterminée : passé le terme, le comptoir n'a plus de titre pour exposer le bien, et le déposant attend qu'on le prévienne. Sans rappel, un article confié il y a dix-huit mois continue de dormir en vitrine, hors contrat, et personne au comptoir ne s'en aperçoit avant que le déposant ne rappelle lui-même.

Le propriétaire veut ouvrir l'application le matin et voir les dépôts qui ont dépassé leur date, au même titre que les acomptes qui expirent et les pièces d'identité qui vont périmer. C'est ce qui lui permet de relancer le déposant, de proposer une prolongation ou d'organiser la restitution avant que la situation ne devienne une réclamation.

Le comptoir constate aujourd'hui que rien ne se déclenche. Le modèle de courrier de relance existe, le comptage des dépôts dépassés existe, mais la date de fin de contrat n'est jamais inscrite au dépôt et la relance quotidienne n'est pas mise en route : les deux bouts de la chaîne manquent, et le rappel reste théorique.

## Hors-scope

- le rappel adressé au déposant lui-même : la relance prévue est un courrier interne, destiné au comptoir
- la résiliation du contrat et le préavis qui l'accompagne, qui relèvent de la correspondance écrite entre les parties
- la restitution des articles une fois le terme constaté, qui a son propre parcours

## Cas d'erreur

- aucune date de fin de contrat n'est portée au dépôt à la signature : le terme est inconnu du comptoir, et aucun dépôt ne peut être reconnu comme dépassé
- la relance quotidienne des dépôts invendus n'est pas mise en route : même déclenchée à la main, elle ne trouve aucun dépôt à signaler et n'envoie rien

## Brief produit

### Purpose

Faire remonter au comptoir les dépôts qui ont dépassé leur terme sans avoir été vendus, avant que le déposant ne s'en charge lui-même.

### User

Le propriétaire du comptoir, qui décide de relancer, de prolonger ou de rendre. Le client particulier, déposant, dont le bien est concerné par le terme.

### Content

Par dépôt dépassé : le numéro du dépôt, le dossier, le nom du déposant et la date de fin de contrat. Le courrier de relance porte l'objet « Rappel : Articles dépôt-vente invendus » suivi du numéro du dépôt.

## Notes techniques

Seule la fonction SQL `notify_depot_vente_invendus()` (SECURITY DEFINER, migration 057) existe : elle parcourt les lots `depot_vente` dont `date_fin_contrat < now()`, poste vers l'API Resend le modèle `interne_depot_vente_invendu`, insère une notification `depot_vente_expire` et journalise dans `email_logs` pour éviter le doublon.

Trois raisons la rendent inopérante : `lots.date_fin_contrat` n'est jamais écrite par `src/` ; le `cron.schedule('notify-depot-vente-invendus', '0 9 * * *', ...)` est resté en commentaire de fin de migration ; le filtre `l.status NOT IN ('finalise','retracte','refuse')` et l'INSERT dans `notifications (type, title, message, lot_id, dossier_id)` ne correspondent plus au schéma en vigueur (colonnes `entity_type` / `entity_id`, CHECK sur `type`). Le réglage `preavis_resiliation_jours` n'est lu nulle part.
