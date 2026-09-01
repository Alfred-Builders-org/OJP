---
id: R-044
title: Les totaux ne sont jamais écrits par l'application, seulement recalculés par la base
statement: Les totaux d'un lot, d'une vente, d'un bon de commande et d'un bon de livraison sont recalculés par des déclencheurs à chaque changement de leurs lignes : aucune écriture applicative ne les fixe directement.
enforcement: constraint
surface: chiffrage
priority: 1
d025_class: coherence_cross_entite
status: active
risk: risquee
---

## Où elle est tenue

Quatre déclencheurs, un par agrégat :

| Déclencheur | Migration |
|---|---|
| `update_lot_totals_trigger` | totaux du lot depuis ses références |
| `update_vente_totals_trigger` | totaux de la vente depuis ses lignes |
| `vente_lignes_bon_commande_total` | total du bon de commande |
| `bon_livraison_lignes_totals` | totaux du bon de livraison (`049_create_bons_livraison.sql`) |

## Pourquoi

Un total écrit par l'application se désynchronise dès qu'une ligne change par un autre chemin : une correction en base, une suppression en cascade, un second écran ouvert sur le même lot. Le total affiché devient alors faux sans que rien ne le signale, et il finit sur une pièce contractuelle remise au client.

Le recalcul par déclencheur rend la désynchronisation impossible : la somme est toujours celle des lignes présentes, quelle que soit la façon dont elles sont arrivées.

Conséquence à connaître pour toute évolution : ajouter une ligne suffit, il ne faut **pas** mettre le total à jour en plus. Le faire ne casse rien, mais c'est du code mort qui laisse croire que le total dépend de lui.
