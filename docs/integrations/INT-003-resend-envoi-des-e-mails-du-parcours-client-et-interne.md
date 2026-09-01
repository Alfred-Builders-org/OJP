---
id: INT-003
title: Resend : envoi des e-mails du parcours client et interne
provider: Resend
auth: api_key
secrets:
  - RESEND_API_KEY
status: active
docs_url: https://resend.com/docs
---

Achemine dix e-mails transactionnels dont les modèles sont éditables en base. Chaque envoi est journalisé.

Le client est initialisé paresseusement : sans clé, la compilation ne doit pas échouer.
