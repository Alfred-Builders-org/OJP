---
id: R-025
title: Les documents des clients ne sont jamais accessibles publiquement
statement: Le compartiment de stockage des documents est privé : toute lecture passe par une URL signée à durée limitée, jamais par un lien direct.
enforcement: constraint
surface: securite
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-035
---

## Où elle est tenue

`supabase/migrations/052_*.sql`, qui déclare le compartiment `documents` en privé. Le compartiment `avatars` reste public.

## Pourquoi

Ce compartiment porte les pièces d'identité des clients et leurs contrats. Une URL publique, même longue et difficile à deviner, reste une URL qui circule dans un courriel, un historique de navigation ou un journal de serveur.

Toute lecture passe donc par une URL signée à durée limitée, délivrée à un utilisateur authentifié.
