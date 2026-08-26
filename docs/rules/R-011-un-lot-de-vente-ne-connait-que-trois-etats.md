---
id: R-011
title: Un lot de vente ne connaît que trois états
statement: Un lot de vente ne passe que par brouillon → en cours → terminé ou annulé ; toute autre transition est rejetée par la base.
enforcement: constraint
surface: cycle-de-vie
priority: 1
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-022
---

## Où elle est tenue

`supabase/migrations/056_validate_status_transitions.sql`, même fonction que [R-010](R-010-un-lot-de-rachat-suit-un-chemin-d-etats-unique-et-sans-retou.md), branche `type = 'vente'`.

## Pourquoi

Une vente n'a pas de délai de rétractation : le client emporte son achat. Son cycle est donc plus court, et l'annulation n'est possible que depuis « en cours », jamais après la clôture.

C'est le second des trois cycles portés par la même table `lots`, distingués par le `type`. Cette polymorphie est le point d'attention n°1 du modèle : toute feature qui touche aux lots doit savoir de quel type elle parle.
