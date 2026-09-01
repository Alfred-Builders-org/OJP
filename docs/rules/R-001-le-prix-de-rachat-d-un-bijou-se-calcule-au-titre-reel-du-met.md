---
id: R-001
title: Le prix de rachat d'un bijou se calcule au titre réel du métal
statement: Le prix de rachat d'un bijou vaut cours du métal au gramme × (titre en millièmes / 1000) × poids en grammes × coefficient de rachat, arrondi au centime.
enforcement: test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour de l'or 18k
surface: chiffrage
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-007
---

## Où elle est tenue

`src/lib/calculations/prix-rachat.ts`, fonction `calculerPrixRachatBijoux`.

Le cours employé n'est pas celui du jour au moment du calcul, mais celui figé sur le lot à sa création (voir [R-019](R-019-les-cours-se-portent-au-millieme-d-euro-sur-toute-la-chaine.md) pour la précision retenue).

## Pourquoi

Un bijou n'est pas en or pur : le titre en millièmes dit quelle fraction de son poids est du métal fin. 750 pour de l'or 18 carats, 800 pour de l'argent courant. Omettre ce facteur surévaluerait le rachat d'un quart.

Le coefficient de rachat porte la marge de la maison. Il se règle sans toucher au code.
