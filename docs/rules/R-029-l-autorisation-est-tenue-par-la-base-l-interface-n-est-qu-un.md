---
id: R-029
title: L'autorisation est tenue par la base, l'interface n'est qu'un second rideau
statement: Les droits d'accès aux données sont portés par les politiques de sécurité au niveau des lignes en base, adossées au rôle et au caractère actif du compte ; le contrôle exercé côté interface ne fait que doubler ce verrou et ne s'y substitue jamais.
enforcement: constraint
surface: acces
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-045
---

## Où elle est tenue

`supabase/migrations/040_rbac_rls_policies.sql` et `062_*.sql`, adossées aux fonctions de session qui rendent le rôle et le caractère actif du compte.

## Pourquoi

Une autorisation portée par l'application seule se contourne par tout accès direct à la base : un outil d'administration, un script de reprise, une requête depuis un autre service. C'est le même raisonnement que pour les règles métier, tranché par [ADR-004](../adr/ADR-004-faire-de-la-securite-au-niveau-des-lignes-l-autorisation-de.md).

Le filtrage d'interface reste utile : il évite d'afficher une page qui se remplirait de vide. Mais il ne protège rien, et il ne faut pas compter dessus pour cela.
