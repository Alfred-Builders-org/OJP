---
id: R-031
title: L'élévation se dit par une ombre nommée, jamais par « shadow » seul
statement: L'élévation suit quatre niveaux (aucune ombre, shadow-sm, shadow-md, shadow-lg). « shadow » seul est proscrit, les niveaux 2 et 3 ajoutent ring-1 ring-foreground/10, et bordure et ombre ne se cumulent jamais pour dire la même élévation.
enforcement: advisory
surface: design
priority: 2
d025_class: format_validation
status: active
risk: standard
---

## Où elle est tenue

`METHODOLOGIE-DESIGN.md`, section 5. Les valeurs sont des variables CSS, ce qui les adapte au thème sombre sans code conditionnel.

| Niveau | Classe | Usage |
|---|---|---|
| 0 | aucune ombre | champs, badges, lignes de table |
| 1 | `shadow-sm` | cartes, en tête, pagination, barre latérale, boutons |
| 2 | `shadow-md ring-1 ring-foreground/10` | infobulles, menus déroulants, sélecteurs |
| 3 | `shadow-lg ring-1 ring-foreground/10` | panneaux latéraux, boîtes de dialogue |

## Pourquoi

Quatre niveaux nommés suffisent à dire ce qui flotte au dessus de quoi. Laisser chacun choisir son ombre produit une profondeur incohérente d'un écran à l'autre, que personne ne remarque isolément mais qui rend l'ensemble flou.

Bordure et ombre disent la même chose : les cumuler alourdit sans rien préciser.

Cette règle est aujourd'hui en `advisory` faute de contrôle automatique, mais elle est vérifiable par recherche dans les fichiers.
