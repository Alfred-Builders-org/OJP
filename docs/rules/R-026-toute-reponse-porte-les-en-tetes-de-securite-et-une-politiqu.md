---
id: R-026
title: Toute réponse porte les en-têtes de sécurité et une politique de contenu fermée
statement: Chaque réponse HTTP porte X-Frame-Options DENY, X-Content-Type-Options nosniff, une politique de référent stricte, une politique de permissions fermant caméra, micro et géolocalisation, HSTS à deux ans, et une politique de sécurité du contenu dont object-src vaut none et base-uri comme form-action valent self.
enforcement: test:e2e/security.spec.ts::security headers are present
surface: securite
priority: 1
d025_class: format_validation
status: active
risk: risquee
---
