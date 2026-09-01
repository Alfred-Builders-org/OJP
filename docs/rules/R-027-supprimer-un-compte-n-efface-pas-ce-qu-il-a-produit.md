---
id: R-027
title: Supprimer un compte n'efface pas ce qu'il a produit
statement: La suppression d'un utilisateur est logique : le profil est conservé pour que les mentions « créé par » restent lisibles sur les lots, dossiers et clients, l'accès est banni, et l'adresse e-mail est neutralisée aux deux endroits où elle est stockée afin de redevenir disponible.
enforcement: constraint
surface: acces
priority: 1
d025_class: invariant_etat
status: active
risk: risquee
source_feature: F-046
---

## Où elle est tenue

`supabase/migrations/076_*.sql` pour la suppression logique, `134_*.sql` pour la libération de l'adresse.

## Pourquoi

Supprimer physiquement un compte emporterait les mentions « créé par » de tous les lots, dossiers et clients qu'il a produits : l'historique deviendrait illisible au moment précis où l'on cherche à comprendre qui a fait quoi.

Mais un compte conservé garde son adresse, qui devient alors impossible à réutiliser. L'adresse est donc neutralisée aux deux endroits où Supabase la stocke, l'originale étant conservée dans les métadonnées pour retracer le compte au besoin. L'opération est rejouable sans effet de bord.
