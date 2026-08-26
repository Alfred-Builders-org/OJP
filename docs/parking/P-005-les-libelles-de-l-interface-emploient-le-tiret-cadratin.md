---
id: P-005
title: Les libelles de l'interface emploient le tiret cadratin
kind: deferred
status: pending
trigger: A la prochaine reprise des libelles d'interface, ou des qu'une regle de typographie devient bloquante a l'integration continue.
---

Le corpus produit est propre, le code ne l'est pas : trois cent six occurrences de tiret cadratin ou demi-cadratin subsistent hors de docs/, dont deux cent cinquante-huit dans les ecrans.

Le gros de ce contingent n'est pas de la prose : c'est le tiret employe comme valeur d'affichage pour un champ vide, sur les fiches client, les tableaux et les ecrans de confie-achat. Le remplacer changerait ce que l'operateur voit. Le reste, libelles de messages et titres de fenetres, se corrige sans risque.

Les deux lots ne se traitent donc pas ensemble, et aucun ne se traite a l'aveugle par un remplacement global. Les occurrences des migrations deja appliquees en production ne se touchent pas du tout.
