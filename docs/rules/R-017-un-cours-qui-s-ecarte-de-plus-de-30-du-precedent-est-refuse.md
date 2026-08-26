---
id: R-017
title: Un cours qui s'écarte de plus de 30 % du précédent est refusé
statement: Un cours saisi qui s'écarte de plus de 30 % du dernier relevé connu est rejeté par la base ; seul le propriétaire peut forcer l'enregistrement, et le relevé automatique ne force jamais.
enforcement: constraint
surface: cours
priority: 1
d025_class: contrainte_valeur
status: active
risk: risquee
source_feature: F-041
---

## Où elle est tenue

`supabase/migrations/136_controle_vraisemblance_cours.sql`, fonction `appliquer_cours`, paramètre `p_forcer` pour la dérogation.

## Pourquoi

Constat de recette : la référence « Bracelet » du lot RAC-2026-0004 était valorisée 3 439,06 euros pour 90 grammes d'argent. Le calcul était juste ; le cours enregistré ce jour là valait 45,00 euros le gramme pour de l'argent, dont le cours réel avoisine 1,80. Une saisie manuelle erronée suffisait à fausser toutes les transactions de la journée, sans qu'aucun contrôle ne s'y oppose.

Le seuil de 30 % est large : les métaux précieux ne bougent pas de 30 % en une journée. Mais il arrête net une virgule mal placée ou un métal saisi dans la mauvaise case.

Le relevé automatique ne force jamais : en cas de rejet, les cours de la veille sont conservés, exactement comme lorsque la source est injoignable.
