---
id: R-037
title: L'application se parcourt au clavier et ses champs sont nommés
statement: Un lien d'évitement apparaît à la première tabulation, les champs de formulaire portent des libellés accessibles, et la navigation au clavier atteint les commandes des formulaires.
enforcement: test:e2e/accessibility.spec.ts::skip-to-content link apparaît au focus clavier
surface: accessibilite
priority: 2
d025_class: invariant_etat
status: active
risk: standard
---

## Où elle est tenue

`e2e/accessibility.spec.ts`.

## Pourquoi

La portée suit la surface : le produit est un outil interne servi à une équipe de boutique, pas un service au public. Le niveau visé est donc le parcours au clavier et la nomination des champs, vérifiés par des tests, plutôt qu'une conformité déclarée à un référentiel.

Un lien d'évitement à la première tabulation et des champs nommés sont ce qui rend une saisie rapide possible sans souris, ce dont bénéficie d'abord un vendeur pressé.

C'est un plancher constaté, pas un plafond visé : il se relèvera si le produit s'ouvre à des utilisateurs extérieurs.
