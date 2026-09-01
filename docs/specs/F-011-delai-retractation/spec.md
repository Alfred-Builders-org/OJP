---
id: F-011
slug: delai-retractation
title: Ouvrir le délai légal de rétractation et en afficher le décompte
epic: E-004
domaine: [DOM-004, DOM-005]
surface: risquee
dependencies: [F-010]
personas: [PER-002, PER-004]
---

# Objectif

Après acceptation, le client dispose d'un délai réglable pendant lequel il peut revenir sur sa décision. Le comptoir voit ce délai courir et sait à l'heure près quand l'affaire peut être menée à son terme.

## Intention

Le délai légal de réflexion n'est pas une formalité : tant qu'il court, rien n'est acquis, ni pour le client qui peut encore récupérer sa marchandise, ni pour le comptoir qui ne doit pas l'envoyer à la fonte. Sans compteur visible, ce délai se tient de tête ou sur un carnet, et deux erreurs symétriques deviennent possibles : fondre trop tôt un bijou que le client réclame encore, ou laisser dormir des semaines un lot que rien ne retient plus. En affichant le début, la fin et le temps restant sur l'affaire elle-même, et en signalant sur la vue du jour les délais qui courent et ceux qui viennent de s'achever, la fenêtre de réflexion cesse d'être une affaire de mémoire.

## Hors-scope

- l'enregistrement de la rétractation elle-même et le remboursement de ce qui a déjà été versé
- la clôture de l'affaire une fois le délai écoulé, qui reste un geste du comptoir
- l'or d'investissement repris en direct, qui passe en attente de paiement sans ouvrir de délai
- la notification du client à l'ouverture ou à l'échéance du délai : il n'en est averti que par les pièces qu'il a reçues

## Cas d'erreur

- le délai arrive à échéance sans nouvelle du client : rien ne se produit de soi-même, l'affaire reste à valider par le comptoir et la vue du jour la signale sous « Délai de rétractation écoulé · à valider »
- le réglage « Délai de rétractation » est porté à 24 heures : les gestes proposés sur l'affaire raisonnent sur 24 heures, alors que l'échéance inscrite à l'acceptation reste posée à 48 heures, si bien que les deux se contredisent

## Brief produit

### Purpose

Rendre le temps visible : savoir, sur chaque affaire acceptée, si le client peut encore revenir et combien de temps il lui reste.

### User

Le vendeur au comptoir, qui suit le délai et finalise l'opération quand il est écoulé. Le client particulier, dont c'est la protection.

### Content

Sur l'affaire, une carte « Délai de rétractation » avec une barre de progression, la date de début, la date de fin, et le temps restant sous la forme « 47h 30m restantes ». Une fois l'échéance passée, la carte annonce que le délai est expiré et que l'affaire peut être finalisée ; en version repliée, elle se réduit à « Délai expiré » ou au temps restant. Sur la vue du jour, deux listes distinctes : « Délai de rétractation en cours » et « Délai de rétractation écoulé · à valider ». La durée du délai se règle dans les paramètres, à la rubrique des règles métier.

## Notes techniques

`finaliserDossierAction` (`src/lib/actions/finalize-actions.ts`) pose `date_envoi` et `date_fin_delai = now() + RETRACTATION_DELAY_MS` sur les références bijoux en `type_rachat = 'direct'`, et `date_acceptation`/`date_fin_retractation` sur le lot ; la constante vaut 48 h en dur. `src/components/actions/retractation-timer.tsx` rend la carte ambre, la barre de progression et le décompte, avec la variante `compact`. `src/components/dashboard/dashboard-alerts.tsx:139,154,191` porte les deux libellés de la vue du jour. Le réglage `business_rules.retractation_heures` (défaut 48) s'édite dans `src/components/parametres/regles-metier-tab.tsx:74` et n'est relu que par `src/components/lots/lot-detail-page.tsx:134` pour `retractationMs`, côté client : d'où la divergence décrite en cas d'erreur.
