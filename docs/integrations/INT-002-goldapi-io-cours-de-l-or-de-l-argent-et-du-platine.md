---
id: INT-002
title: goldapi.io : cours de l'or, de l'argent et du platine
provider: goldapi.io
auth: api_key
secrets:
  - GOLDAPI_KEY
status: active
docs_url: https://www.goldapi.io/
---

Source des cours relevés une fois par jour. Le prix du gramme en 24 carats est retenu comme cours du métal pur.

Si la source est injoignable, les cours de la veille sont conservés et la journée est consommée : on ne réessaie pas en boucle, pour protéger le quota.
