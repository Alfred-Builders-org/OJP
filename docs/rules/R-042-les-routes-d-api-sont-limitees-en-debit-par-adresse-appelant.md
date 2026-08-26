---
id: R-042
title: Les routes d'API sont limitées en débit par adresse appelante
statement: Chaque route d'interface de programmation compte les requêtes par adresse IP sur une fenêtre glissante et répond par un refus au delà du seuil ; les routes sensibles, celles qui envoient un courriel ou touchent aux comptes, ont un seuil plus bas que les autres.
enforcement: constraint
surface: securite
priority: 2
d025_class: fenetre_temporelle
status: active
risk: risquee
---

## Où elle est tenue

`src/lib/rate-limit.ts`, appliqué en première instruction des sept routes sous `src/app/api/`. Deux limiteurs : `apiLimiter` pour la recherche, `sensitiveApiLimiter` pour l'envoi de courriels et la gestion des comptes.

Le compteur est en mémoire du processus, sans dépendance externe.

## Pourquoi

La recherche globale interroge la base à chaque frappe, et les routes de compte envoient des courriels. Sans seuil, une boucle mal écrite ou un appel répété épuise la base ou le quota d'envoi, et le coût se voit sur la facture avant de se voir dans les journaux.

La limite passe **avant** le contrôle de session, et c'est délibéré : un appelant non authentifié doit être arrêté au plus tôt, sans qu'on aille interroger la base pour lui.

**Limite à connaître :** le compteur vit dans la mémoire du processus. Sur plusieurs instances, chacune compte pour elle, et le seuil réel est donc multiplié par leur nombre. C'est acceptable pour l'usage d'une boutique, et ce le serait moins pour un service ouvert.
