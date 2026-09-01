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

## Où elle est tenue

Les sept routes sous `src/app/api/`, qui vérifient toutes la session et répondent 401. `src/middleware.ts` les exclut explicitement de la redirection vers la page de connexion.

## Pourquoi

Le filtrage du middleware couvrait aussi les routes d'interface de programmation : un appel non authentifié partait vers la page de connexion, et l'appelant recevait une page HTML avec un statut 200 là où il attend du JSON. Un client d'interface ne sait rien faire de cela, et sa gestion d'erreur ne se déclenche pas.

La protection n'a pas disparu, elle a changé de forme : chaque route rend son propre verdict, 401 sans session, 403 sans le rôle. La redirection reste en place pour les pages, qui elles s'affichent dans un navigateur.

Le rappel d'authentification refuse par ailleurs toute redirection vers un domaine externe, ce qui ferme la redirection ouverte.
