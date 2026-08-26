---
id: R-039
title: Le travail se pousse sur staging, jamais directement sur la branche de production
statement: Tout nouveau travail est poussé sur la branche staging ; aucun envoi direct sur la branche principale n'est fait sans demande explicite.
enforcement: advisory
surface: contribution
priority: 1
d025_class: advisory_irreductible
status: active
risk: standard
---

## Où elle est tenue

`CLAUDE.md`. La branche `main` est la production, `staging` le développement et la revue.

## Pourquoi

`main` est déployée. Un envoi direct met en production un travail que personne n'a relu, et sur ce produit une régression se découvre au comptoir, devant un client.

`staging` est aussi la seule branche que l'index de la Batcave lit : un corpus produit poussé ailleurs n'existe pour personne.
