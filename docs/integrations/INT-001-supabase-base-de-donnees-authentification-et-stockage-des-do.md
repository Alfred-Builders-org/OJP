---
id: INT-001
title: Supabase : base de données, authentification et stockage des documents
provider: Supabase
auth: api_key
secrets:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
status: active
docs_url: https://supabase.com/docs
---

Porte le PostgreSQL du produit avec ses 136 migrations, l'authentification par e-mail et mot de passe, et deux compartiments de stockage : les avatars en public, les documents contractuels et pièces d'identité en privé.

C'est aussi le siège de l'autorisation : les politiques de sécurité au niveau des lignes sont l'autorisation de référence.
