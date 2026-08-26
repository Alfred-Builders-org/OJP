---
id: F-056
slug: assistance-integree
title: Joindre l'assistance depuis n'importe quel écran
epic: E-018
surface: standard
dependencies: none
personas: [PER-002, PER-003]
---

# Objectif

Un widget d'assistance chargé sur toute l'application, écrans de connexion compris, pour qu'un vendeur bloqué en pleine opération demande de l'aide sans changer d'outil. Le domaine du service est déclaré explicitement dans la politique de sécurité du contenu, seule façon pour lui de se charger.

## Intention

Quand un vendeur se bloque, il a un client en face de lui. Chercher une adresse d'assistance, ouvrir sa messagerie, décrire le contexte : le temps que cela prend se voit à la caisse, et la plupart du temps la question ne part jamais.

Le point d'entrée vit donc dans l'application elle-même, sur toutes les pages, y compris avant la connexion puisque c'est précisément là qu'on peut être bloqué dehors. Il se charge après l'affichage, pour que l'aide n'ait jamais le moindre coût sur la vitesse des écrans de travail.

L'autre enjeu est la confiance : l'application ferme par défaut tout appel vers un domaine tiers. Ouvrir la porte à ce service est une décision assumée et écrite, et c'est ce qui la rend révocable.

## Hors-scope

- l'accueil des demandes, leur suivi et leur résolution, qui se passent hors de l'application
- l'envoi automatique d'un contexte technique avec la demande : le vendeur décrit lui-même sa situation
- un second point d'entrée support par lien, formulaire ou adresse de courriel

## Cas d'erreur

- le service d'assistance est injoignable : aucun bouton d'aide n'apparaît, l'application reste entièrement utilisable, et aucun autre point d'entrée support n'est proposé en remplacement
- un domaine tiers non déclaré dans la politique de contenu tente de charger un script : il est bloqué, et la page continue de fonctionner sans lui

## Brief produit

### Purpose

Rendre l'aide joignable là où le blocage se produit, sans que l'utilisateur ait à savoir où écrire ni à quitter son écran.

### User

Le vendeur au comptoir, bloqué pendant une opération avec un client en face de lui. L'administrateur de la solution, qui reçoit les demandes et intervient au-dessus des rôles métier.

### Content

Un widget d'assistance présent sur toutes les pages de l'application, écrans de connexion et de récupération de mot de passe compris.

Il se charge après l'affichage de la page, de sorte qu'aucun écran n'attend après lui. C'est le seul point d'entrée support de l'application.

Les en-têtes de sécurité et la politique de contenu restent en place sur chaque réponse ; la politique nomme le domaine du service d'assistance parmi les origines autorisées, et n'en autorise aucune autre.

## Notes techniques

Le widget est chargé dans le layout **racine** (`src/app/layout.tsx:40-44`), hors du groupe `(dashboard)`, donc avant toute authentification : `<Script src="https://alfrhelp-web-staging.up.railway.app/widget.js" data-site-id="6270b1bc-b08d-4c63-aabc-e02d97f0c252" strategy="afterInteractive" />`.

`next.config.ts:28` ajoute `https://alfrhelp-web-staging.up.railway.app` à `script-src` et `connect-src` de la politique de contenu, qui reste par ailleurs fermée (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). Les en-têtes sont couverts par `e2e/security.spec.ts`.

**Dette connue** : l'URL pointe l'environnement **staging** du service d'assistance, y compris en production. `AgentationProvider` monte `Agentation` uniquement quand `NODE_ENV === 'development'` : c'est un outil de développement, sans rapport avec l'assistance utilisateur.
