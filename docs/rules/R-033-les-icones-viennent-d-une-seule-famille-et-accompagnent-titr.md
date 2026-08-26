---
id: R-033
title: Les icônes viennent d'une seule famille et accompagnent titres et boutons
statement: Les icônes sont des Phosphor en style duotone ; chaque titre de carte et chaque bouton en porte une devant son libellé, à l'exception des composants internes de la bibliothèque d'interface.
enforcement: advisory
surface: design
priority: 3
d025_class: format_validation
status: active
risk: standard
---

## Où elle est tenue

`METHODOLOGIE-DESIGN.md`, section 8. Le passage à Phosphor est documenté par [ADR-014](../adr/ADR-014-adopter-phosphor-en-duotone-comme-famille-d-icones-unique.md).

## Pourquoi

Une icône devant un titre de carte ou un libellé de bouton donne un point d'accroche visuel dans des écrans denses. Le style duotone tient mieux la lecture que le trait simple à petite taille.

L'exception des composants générés est assumée : ils embarquent leur propre famille, et les modifier reviendrait à éditer des fichiers que la convention du projet interdit de retoucher à la main.
