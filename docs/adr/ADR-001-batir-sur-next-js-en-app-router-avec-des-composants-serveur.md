---
id: ADR-001
title: Bâtir sur Next.js en App Router, avec des composants serveur par défaut
status: accepted
---

## Contexte

Le produit est un back-office métier dense en écrans de liste et de détail, servi à une équipe de boutique. Il fallait un cadre qui rende vite côté serveur sans imposer une couche d'interface de programmation séparée.

## Décision

L'application est bâtie sur Next.js en App Router, avec React en composants serveur par défaut et des composants client uniquement là où l'interactivité l'exige. Les mutations passent par des actions serveur.

## Conséquences

Pas de couche d'interface de programmation à maintenir pour l'essentiel du produit. En contrepartie, le rendu doit être forcé en dynamique sur tout le tableau de bord, faute de quoi la compilation tente de pré-rendre des pages qui interrogent la base.

## Alternatives

Une application monopage avec une interface de programmation séparée aurait doublé le travail de contrat entre les deux couches pour un produit à un seul consommateur.
