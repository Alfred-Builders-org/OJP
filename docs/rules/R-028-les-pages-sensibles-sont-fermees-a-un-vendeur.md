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
