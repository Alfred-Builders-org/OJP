---
id: R-036
title: Toute page rend correctement en thème sombre
statement: Le thème sombre est un mode de premier rang : chaque page l'applique et y garde ses éléments lisibles, sans variante d'écran laissée en clair.
enforcement: advisory
surface: design
priority: 2
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-049
---

## Où elle est tenue

`e2e/dark-mode.spec.ts`, même limite que [R-035](R-035-aucune-page-ne-defile-horizontalement-quelle-que-soit-la-lar.md) : le cas est nommé par interpolation et ne se résout pas.

Le thème est porté par des variables CSS en espace OKLCH, ce qui conserve la luminosité perçue entre les deux déclinaisons.

## Pourquoi

Le thème sombre n'est pas une option cosmétique dans un outil ouvert huit heures par jour. Le traiter en variante servie après coup produit des écrans où le contraste tombe, ou des zones restées claires qui éblouissent.

Chaque utilisateur choisit son thème, et son choix est retenu.
