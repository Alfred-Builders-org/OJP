---
id: DOM-004
title: Lot
aka:
  - opération
  - ligne d'affaire
---

L'unité d'opération du produit, et son objet pivot. Un lot est d'un des trois types (rachat, vente ou dépôt-vente), qui se répartissent sur deux machines à états : le rachat et le dépôt-vente suivent le même chemin, la vente a le sien. C'est le point d'attention n°1 du modèle : trois métiers distincts partagent une seule table, distingués par leur type. Le lot fige les cours du jour au moment de sa création, ce qui rend son chiffrage rejouable des mois plus tard.
