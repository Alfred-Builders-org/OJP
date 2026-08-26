---
id: R-038
title: Les composants d'interface s'ajoutent par la ligne de commande, jamais à la main
statement: Un composant de la bibliothèque d'interface s'ajoute par sa commande dédiée et non par création manuelle d'un fichier ; le personnaliser est admis, mais par les propriétés et les variantes plutôt que par modification du fichier généré.
enforcement: advisory
surface: contribution
priority: 3
d025_class: advisory_irreductible
status: active
risk: standard
---

## Où elle est tenue

`CLAUDE.md`, et les composants concernés vivent dans `src/components/ui/`.

## Pourquoi

Ces composants sont générés dans le dépôt plutôt qu'installés en dépendance, ce qui est le parti pris de [ADR-015](../adr/ADR-015-batir-l-interface-sur-shadcn-avec-un-theme-en-oklch.md). Ils appartiennent donc au projet et se personnalisent.

Mais un fichier généré modifié à la main diverge de sa source : la prochaine régénération l'écrase, ou bien on ne régénère plus jamais. Passer par les propriétés et les variantes garde les deux possibilités ouvertes.
