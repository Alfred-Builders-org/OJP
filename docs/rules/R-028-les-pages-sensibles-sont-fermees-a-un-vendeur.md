---
id: R-028
title: Les pages sensibles sont fermées à un vendeur
statement: Les fonderies, les commandes, le routage et le suivi de fonderie, les paramètres et la gestion des utilisateurs sont réservés au propriétaire et au super-administrateur, aussi bien sur les pages que sur les routes d'interface de programmation correspondantes.
enforcement: test:e2e/security.spec.ts::protected routes redirect to sign-in
surface: acces
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-045
---

## Où elle est tenue

`src/types/auth.ts`, listes `OWNER_ONLY_ROUTES` et `OWNER_ONLY_PREFIXES`, appliquées par `src/middleware.ts`.

Les routes d'interface de programmation correspondantes répondent 403 elles mêmes : depuis la correction du filtrage, le middleware ne les redirige plus (voir [R-030](R-030-une-requete-non-authentifiee-n-obtient-jamais-de-donnees.md)).

## Pourquoi

Un vendeur reçoit les clients et chiffre leur or. Les fonderies, les commandes, les paramètres et la gestion des comptes relèvent du propriétaire : ce sont les leviers qui fixent la marge, les partenaires et les accès.

Ce filtrage est un confort d'interface, pas la protection. Elle est en base, et c'est [R-029](R-029-l-autorisation-est-tenue-par-la-base-l-interface-n-est-qu-un.md) qui la porte.
