---
id: R-018
title: Les cours se relèvent une fois par jour et la tentative est tracée même en échec
statement: Le relevé automatique est réservé une fois par jour par un verrou atomique ; la date de relevé enregistre la tentative et non le succès, de sorte qu'une source injoignable ne déclenche pas de nouvelle tentative avant le lendemain.
enforcement: constraint
surface: cours
priority: 1
d025_class: fenetre_temporelle
status: active
risk: risquee
source_feature: F-040
---

## Où elle est tenue

`supabase/migrations/131_*.sql`, fonction `reserver_maj_cours`. La réservation est une mise à jour conditionnelle atomique : si deux utilisateurs ouvrent l'application en même temps, un seul obtient le relevé.

## Pourquoi

Un seul cours par jour garantit qu'un client expertisé le matin et un autre l'après midi sont traités à l'identique. C'est une exigence d'équité, pas une économie technique.

La date enregistre la tentative et non le succès, et c'est délibéré : si la source est injoignable, la journée est consommée plutôt que de déclencher une boucle de tentatives qui épuiserait le quota. Le relevé manuel reste disponible au propriétaire.
