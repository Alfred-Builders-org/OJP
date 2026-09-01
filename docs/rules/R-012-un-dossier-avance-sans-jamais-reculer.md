---
id: R-012
title: Un dossier avance sans jamais reculer
statement: Un dossier ne passe que par brouillon → en cours → finalisé ; aucun retour à un état antérieur n'est accepté par la base.
enforcement: constraint
surface: cycle-de-vie
priority: 2
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-005
---

## Où elle est tenue

`supabase/migrations/056_validate_status_transitions.sql`, fonction `validate_dossier_status_transition`.

## Pourquoi

Un dossier finalisé a produit des pièces contractuelles remises au client et des mouvements d'argent enregistrés. Le rouvrir rendrait ces pièces incohérentes avec son contenu.

Corriger un dossier clos passe donc par une opération explicite qui laisse une trace, jamais par un retour en arrière silencieux.
