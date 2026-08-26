---
id: INT-006
title: GitHub Actions : porte d'intégration continue bloquante
provider: GitHub
auth: none
secrets:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
status: active
docs_url: https://docs.github.com/actions
---

Exécute l'analyse statique, la vérification de types avec la compilation, puis les tests de bout en bout, sur toute proposition de fusion vers la branche principale ou staging et sur tout envoi vers staging.
