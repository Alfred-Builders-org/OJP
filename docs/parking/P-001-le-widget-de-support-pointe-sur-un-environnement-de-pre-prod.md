---
id: P-001
title: Le widget de support pointe sur un environnement de pré-production, y compris en production
kind: concern_carry
status: pending
trigger: Avant la prochaine livraison au client, ou dès qu'une adresse de production existe pour ce widget.
---

La politique de sécurité du contenu autorise `alfrhelp-web-staging.up.railway.app` dans `script-src` et `connect-src`, sans distinction d'environnement.

Conséquence : le support servi au client passe par une pré-production, dont la disponibilité et le contenu ne sont garantis par personne.

Constat d'inventaire, pas une demande du client.
