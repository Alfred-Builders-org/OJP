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

## Où elle est tenue

`next.config.ts`, fonction `headers`. La politique de sécurité du contenu y est déclarée en entier.

## Pourquoi

Ces en têtes ferment les vecteurs qui ne dépendent pas du code applicatif : l'affichage du site dans un cadre distant, l'interprétation d'un fichier selon son contenu plutôt que son type déclaré, la fuite de l'adresse consultée vers un tiers, et l'accès à la caméra ou à la position.

La politique de contenu est fermée par défaut et n'ouvre que ce dont l'application a besoin. Toute nouvelle intégration tierce demande de l'y déclarer explicitement, ce qui est voulu : c'est le moment où l'on décide si on lui fait confiance.
