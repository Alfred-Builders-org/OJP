---
id: R-041
title: Personne ne modifie son propre rôle, et un vendeur ne modifie celui de personne
statement: Toute tentative de changer le rôle ou le caractère actif d'un profil est annulée par la base quand elle vient du titulaire du profil lui-même, ou d'un utilisateur qui n'est ni propriétaire ni super-administrateur : les deux champs reprennent leur valeur antérieure.
enforcement: constraint
surface: acces
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-045
---

## Où elle est tenue

`supabase/migrations/039_add_rbac.sql`, fonction `protect_role_fields`, déclenchée avant toute mise à jour d'un profil.

La garde ne lève pas d'erreur : elle **réécrit** les champs à leur valeur d'origine. L'appelant croit avoir écrit, la base a conservé.

## Pourquoi

C'est la garde qui empêche l'élévation de privilège. Sans elle, un vendeur qui atteint la table des profils, par l'interface ou par tout autre chemin, se donne le rôle de propriétaire et obtient les cours, les paramètres, les fonderies et la gestion des comptes.

Les deux cas sont traités séparément parce qu'ils sont distincts : se promouvoir soi-même, et promouvoir quelqu'un d'autre. Le second reste ouvert au propriétaire, qui doit bien pouvoir nommer un collaborateur.

Le service d'administration passe outre, ce qui est voulu : c'est par lui que passe l'invitation d'un collaborateur avec son rôle initial.

Cette règle est le complément de [R-029](R-029-l-autorisation-est-tenue-par-la-base-l-interface-n-est-qu-un.md), qui dit que l'autorisation est en base. Encore faut-il que le rôle sur lequel elle s'appuie ne soit pas modifiable par celui qu'elle contraint.
