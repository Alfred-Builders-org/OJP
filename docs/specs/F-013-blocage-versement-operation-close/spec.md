---
id: F-013
slug: blocage-versement-operation-close
title: Interdire tout versement au client sur une opération sans suite
epic: E-004
domaine: [DOM-004, DOM-013]
surface: risquee
dependencies: [F-038]
personas: [PER-001, PER-002]
---

# Objectif

Un lot rétracté, refusé ou annulé ne peut plus donner lieu à un paiement sortant, quel que soit le chemin de saisie. Le refus est opposé à la saisie elle-même, et son motif est dit en clair à qui l'a tentée.

## Intention

Une affaire rétractée ou refusée est marquée close exactement comme une affaire menée à son terme : seule l'issue les distingue, et rien à l'écran n'empêchait de payer un client qui venait de rendre sa marchandise. C'est arrivé deux fois à la recette du 13 août, sur une rétractation puis sur un devis refusé, et dans les deux cas l'argent était sorti hors du parcours normal de paiement. Le garde-fou est donc posé au plus près de l'écriture du mouvement : peu importe l'écran d'où vient la saisie, un versement au client sur une affaire sans suite est refusé, et le vendeur lit pourquoi plutôt qu'un message d'incident. En amont, la vue du jour cesse de réclamer un paiement sur ces affaires, pour que personne ne soit invité à commettre l'erreur.

## Hors-scope

- les mouvements entrants, qui restent permis pour que la somme rendue par un client puisse revenir en caisse
- le versement à une fonderie et l'encaissement d'une vente, qui ne sont pas concernés par ce garde-fou
- la rétractation elle-même et le remboursement qu'elle déclenche
- la correction des versements fautifs déjà saisis avant la mise en place du garde-fou

## Cas d'erreur

- un versement au client est tenté sur l'affaire RAC-2026-0010 dont l'issue est « rétracté » : l'enregistrement est refusé et le motif est affiché tel quel au vendeur
- l'enregistrement échoue pour une raison étrangère à la clôture : le message est alors précédé de « Le règlement n'a pas pu être enregistré. »

## Brief produit

### Purpose

Rendre impossible le versement d'argent à un client sur une affaire qui n'ira pas à son terme, et le rendre impossible partout, pas seulement dans le parcours prévu.

### User

Le vendeur au comptoir, qui saisit les mouvements d'argent et doit comprendre un refus. Le propriétaire, dont la vue du jour ne doit plus réclamer de paiement sur ces affaires.

### Content

Sur une affaire dont l'issue est « rétracté », « refusé » ou « annulé », toute tentative de versement au client est refusée et l'écran affiche le motif tel qu'il est formulé : « Aucun paiement n'est du sur le lot RAC-2026-0010 : l'operation est close (retracte). ». Les autres échecs de saisie restent annoncés comme tels, précédés de « Le règlement n'a pas pu être enregistré. ». La vue du jour, elle, écarte ces affaires de la liste des paiements dus.

## Notes techniques

Trois garde-fous superposés. Le premier tient en base : `supabase/migrations/135_bloquer_reglement_operation_sans_suite.sql` pose un trigger `BEFORE INSERT OR UPDATE` sur `reglements` qui laisse passer tout mouvement qui n'est pas à la fois `sens = 'sortant'` et `type = 'rachat'`, et lève sinon `'Aucun paiement n''est du sur le lot % : l''operation est close (%).'` avec `ERRCODE = 'check_violation'` quand le lot porte `outcome IN ('retracte','refuse','annule')`. Le deuxième est l'interface : `src/components/reglements/reglement-dialog.tsx:90-101` détecte la sous-chaîne « operation est close » et affiche le message verbatim, sinon le préfixe. Le troisième est la vue du jour : `FILTRE_OPERATION_ABOUTIE` (`src/components/dashboard/dashboard-helpers.ts:65-67`) vaut `outcome.is.null,outcome.not.in.(retracte,refuse,annule)` et est appliqué par `src/components/dashboard/dashboard-alerts-server.tsx:84` ; `isOperationAboutie` est couvert par six cas vitest dans `src/components/dashboard/dashboard-helpers.test.ts`.
