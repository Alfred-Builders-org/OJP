---
id: R-035
title: Aucune page ne défile horizontalement, quelle que soit la largeur
statement: Sur toutes les tailles d'écran servies, le contenu principal reste visible sans défilement horizontal.
enforcement: advisory
surface: design
priority: 2
d025_class: invariant_etat
status: active
risk: standard
---

## Où elle est tenue

`e2e/responsive.spec.ts` couvre cette règle sur trois largeurs, mais son cas est nommé par interpolation : ni le lint ni l'indexeur ne savent le résoudre, d'où un `enforcement: advisory` alors qu'un test existe.

Rendre ce test opposable demanderait de nommer le cas en littéral, ce qui touche au code de test.

## Pourquoi

Un défilement horizontal casse la lecture d'une table et donne l'impression que l'écran est cassé. Il apparaît presque toujours par un élément qui déborde de son conteneur, pas par un choix délibéré, donc il se découvre en usage.

Le dépôt porte une série de correctifs de ce type sur les conteneurs de page, ce qui dit assez que la vigilance seule ne suffit pas.
