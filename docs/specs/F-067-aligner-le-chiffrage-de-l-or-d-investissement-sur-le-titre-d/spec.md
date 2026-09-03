---
id: F-067
slug: aligner-le-chiffrage-de-l-or-d-investissement-sur-le-titre-d
title: Aligner le chiffrage de l'or d'investissement sur le titre du produit
epic: E-007
stage: skeleton
surface: standard
---

# Objectif

Aligner le chiffrage de l'or d'investissement sur le titre du produit.

Deux formules coexistaient pour le meme produit. L'ecran de vente appliquait le
titre ; la fiche du catalogue et le formulaire de rachat ne l'appliquaient pas,
au nom de R-002. Une meme piece affichait donc deux prix distants d'environ 10 %
selon l'ecran ou on la regardait.

R-002 justifiait l'absence de titre par une prémisse : « le poids du catalogue
est celui d'or fin ». Les donnees la contredisent. Toutes les pieces dont le
poids officiel est verifiable portent leur poids BRUT — un napoleon 20 F y pese
6,45 g quand son or fin est de 5,81 g, un souverain 7,99 g pour 7,32 g fins, un
50 pesos 41,67 g pour 37,50 g. La seule ligne au poids fin est un Krugerrand
d'une once d'argent, ou brut et fin coincident au titre 999.

Le titre s'applique donc, partout. La consequence tenait dans le rachat : on
payait le client sur le poids brut, alliage compris, soit environ 10 % au-dessus
de la valeur du metal sur toute piece qui n'est pas en or fin.

## Impact regles

### MODIFIED R-002
statement: Le prix d'un lingot ou d'une piece d'investissement vaut cours du metal au gramme x titre en millièmes x poids catalogue x coefficient, le poids catalogue etant un poids brut.
raison: Le catalogue porte des poids bruts et non des poids d'or fin, ce que la regle supposait. Sans le titre, l'alliage etait valorise au prix de l'or : environ 10 % de trop sur toute piece au titre 900 ou 916, au rachat comme a l'affichage.
