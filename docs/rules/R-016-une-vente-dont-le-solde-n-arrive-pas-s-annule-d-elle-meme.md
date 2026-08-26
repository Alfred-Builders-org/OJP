---
id: R-016
title: Une vente dont le solde n'arrive pas s'annule d'elle-même
statement: Un lot de vente dont l'acompte est payé mais dont le solde reste impayé à la date limite est automatiquement annulé, et ses articles retournent à leur état d'origine, en stock ou en dépôt-vente s'ils en venaient.
enforcement: constraint
surface: paiements
priority: 1
d025_class: fenetre_temporelle
status: active
risk: risquee
source_feature: F-023
---

## Où elle est tenue

`supabase/migrations/027_auto_cancel_expired_acompte.sql`, fonction `cancel_expired_acompte_lots`.

Les articles retrouvent leur état d'origine : « en stock », ou « en dépôt-vente » s'ils venaient d'un contrat.

## Pourquoi

Un acompte réserve l'article et le sort du stock disponible. Sans échéance, un article resterait indéfiniment immobilisé sur une vente que le client n'honore pas.

Le délai se règle en paramètres, avec les douze autres seuils de [R-024](R-024-les-seuils-du-metier-se-reglent-dans-l-application-pas-dans.md).
