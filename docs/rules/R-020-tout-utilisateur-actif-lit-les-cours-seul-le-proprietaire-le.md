---
id: R-020
title: Tout utilisateur actif lit les cours, seul le propriétaire les écrit
statement: La lecture des paramètres, qui portent les cours, est ouverte à tout utilisateur actif, sans quoi un vendeur chiffrerait des lots à zéro sans avertissement ; l'écriture reste réservée au propriétaire, un vendeur ne pouvant l'obtenir que par un jeton de relevé à usage unique.
enforcement: constraint
surface: acces
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-040
---

## Où elle est tenue

`supabase/migrations/129_*.sql` pour l'ouverture de la lecture, `132_*.sql` pour le jeton à usage unique.

## Pourquoi

La lecture avait été fermée par excès de prudence, et le prix en a été mesuré : pour un vendeur, la lecture des paramètres échouait silencieusement, le lot enregistrait des cours à zéro, et le formulaire affichait un prix de rachat de 0 euro sans aucun avertissement.

L'écriture reste réservée, mais un vendeur doit pouvoir déclencher le relevé du matin. D'où le jeton : son porteur écrit une fois, puis le jeton est consommé. Le raisonnement complet est dans [ADR-005](../adr/ADR-005-reserver-l-ecriture-des-cours-par-un-jeton-a-usage-unique-pl.md).
