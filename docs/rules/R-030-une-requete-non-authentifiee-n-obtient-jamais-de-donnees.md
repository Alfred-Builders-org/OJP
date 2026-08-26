---
id: R-030
title: Une requête non authentifiée n'obtient jamais de données
statement: Toute route d'interface de programmation répond 401 à une requête non authentifiée, et le rappel d'authentification refuse toute redirection vers un domaine externe.
enforcement: test:e2e/security.spec.ts::API routes return 401 for unauthenticated requests
surface: securite
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-043
---
