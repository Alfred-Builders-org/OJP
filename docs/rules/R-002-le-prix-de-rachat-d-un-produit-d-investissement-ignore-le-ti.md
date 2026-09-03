---
id: R-002
title: Le prix de rachat d'un produit d'investissement ignore le titre
statement: Le prix d'un lingot ou d'une piece d'investissement vaut cours du metal au gramme x titre en millièmes x poids catalogue x coefficient, le poids catalogue etant un poids brut.
enforcement: test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour un lingot
surface: chiffrage
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-007
---

## Où elle est tenue

`src/lib/calculations/prix-rachat.ts`, fonction `calculerPrixRachatOrInvest`.

## Pourquoi

Le poids vient du catalogue et non d'une pesée, parce que ces produits sont normalisés. Mais c'est un poids **brut** : un napoléon 20 F y pèse 6,45 g quand son or fin est de 5,81 g, un souverain 7,99 g pour 7,32 g fins, un 50 pesos 41,67 g pour 37,50 g. Le titre doit donc s'appliquer pour redescendre à l'or réellement contenu.

La formule rejoint celle du rachat d'un bijou. La seule différence tient à l'origine du poids — le catalogue plutôt que la balance — ce qui justifie une fonction nommée à part, mais pas un calcul distinct : `calculerPrixRachatOrInvest` délègue.

## Ce qu'elle disait avant, et pourquoi c'était faux

Jusqu'à F-067, cette règle écartait le titre au motif que « ces produits sont en or fin ». La prémisse était fausse : les poids saisis sont bruts. La conséquence se lisait au rachat, où l'alliage était payé au prix de l'or — environ 10 % de trop sur toute pièce au titre 900 ou 916. Elle se voyait aussi à l'écran, l'ancienne page de vente appliquant le titre quand la fiche du catalogue ne l'appliquait pas : deux prix pour la même pièce.

Le titre de cette règle, hérité de l'énoncé d'origine, dit encore l'inverse de ce qu'elle prescrit. Seul un rail peut le réécrire.


---

**Mise à jour - F-067 (2026-09-03) :** Le catalogue porte des poids bruts et non des poids d'or fin, ce que la regle supposait. Sans le titre, l'alliage etait valorise au prix de l'or : environ 10 % de trop sur toute piece au titre 900 ou 916, au rachat comme a l'affichage.

> Le prix d'un lingot ou d'une piece d'investissement vaut cours du metal au gramme x titre en millièmes x poids catalogue x coefficient, le poids catalogue etant un poids brut.
