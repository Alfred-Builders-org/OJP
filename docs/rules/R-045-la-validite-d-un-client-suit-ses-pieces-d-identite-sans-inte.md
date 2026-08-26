---
id: R-045
title: La validité d'un client suit ses pièces d'identité sans intervention
statement: Le caractère valide d'un client est recalculé par la base à chaque ajout, modification ou suppression d'une de ses pièces d'identité : il n'est jamais saisi ni corrigé à la main.
enforcement: constraint
surface: conformite
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
source_feature: F-002
---

## Où elle est tenue

Déclencheur `update_client_validity_on_doc_change` sur `client_identity_documents`.

## Pourquoi

C'est le mécanisme derrière [R-022](R-022-aucune-operation-ne-s-ouvre-sans-piece-d-identite-valide.md), qui interdit d'ouvrir une opération sans pièce valide. Encore faut-il que la validité soit juste au moment où on la lit.

Un indicateur saisi à la main devient faux le lendemain de l'expiration, sans que personne ne le touche : c'est le propre d'une date de péremption. Le recalcul à la source est la seule façon de le tenir sans tâche périodique.

Cela vaut aussi à la suppression d'une pièce : retirer le seul justificatif d'un client le rend immédiatement invalide, et son dossier suivant sera refusé.
