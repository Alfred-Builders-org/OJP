---
id: R-010
title: Un lot de rachat ou de dépôt-vente suit un chemin d'états unique et sans retour
statement: Un lot de rachat ou de dépôt-vente ne passe que par brouillon → devis envoyé → accepté → en rétractation → finalisé ou rétracté, le refus étant possible depuis brouillon ou devis envoyé ; toute autre transition est rejetée par la base.
enforcement: constraint
surface: cycle-de-vie
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-008
---

## Où elle est tenue

`supabase/migrations/056_validate_status_transitions.sql`, fonction `validate_lot_status_transition`, déclenchée avant toute mise à jour du statut d'un lot.

Le chemin admis, et lui seul :

```
brouillon -> devis_envoye -> accepte -> en_retractation -> finalise
    |            |                          |
    +-> refuse   +-> refuse                 +-> retracte
```

## Pourquoi

Le parcours de rachat porte un délai légal : un lot ne peut pas passer de « accepté » à « finalisé » sans avoir traversé la rétractation. Contrôler cela dans l'interface seule laisserait la porte ouverte à toute écriture directe, ce que [ADR-003](../adr/ADR-003-tenir-les-regles-metier-en-base-plutot-que-dans-le-code-appl.md) a tranché.

Le dépôt-vente suit le même chemin que le rachat, parce que le déposant dispose du même délai.
