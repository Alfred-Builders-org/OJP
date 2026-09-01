---
id: F-021
slug: stock-investissement-non-negatif
title: Empêcher le stock d'un produit d'investissement de passer sous zéro
epic: E-007
domaine: [DOM-007]
surface: standard
dependencies: [F-020]
personas: [PER-002, PER-001]
---

# Objectif

Vendre ce qu'on n'a pas fausse l'inventaire et la comptabilité matière. La quantité d'un produit catalogué ne descend jamais sous zéro, et toute sortie excessive est refusée avec un motif que le vendeur peut lire.

## Intention

Le stock d'or d'investissement bouge par des chemins qui ne se voient pas les uns les autres : une pièce entre quand un rachat est payé, une autre sort quand on sert une vente depuis la réserve, une autre encore entre quand un bon de commande revient de la fonderie. Chacun de ces écrans croit connaître le disponible, et aucun ne sait ce que les deux autres viennent de faire.

Un stock négatif n'est pas une anomalie d'affichage : c'est une pièce qu'on a promise à un client sans la détenir, et une ligne d'inventaire qui ne se réconciliera plus jamais avec le coffre. La maison préfère un refus net à un chiffre faux.

Le refus doit rester lisible pour celui qui le reçoit. Un vendeur devant son client n'a pas à décoder un incident technique : il doit voir qu'il manque des pièces, combien il en reste, et combien on lui en demandait. C'est pourquoi la garde parle avant que la protection de dernier ressort ne se déclenche, et c'est aussi pourquoi elle est tenue au plus près du compte, là où aucun écran ne peut la contourner.

## Hors-scope

- le réapprovisionnement lui-même : commander à une fonderie ce qui manque relève de la filière fonderie
- la réservation d'un produit pour un client, qui relève de la vente
- l'inventaire des bijoux repris, qui n'est pas compté en quantité mais pièce par pièce
- l'alerte préventive sur un stock bas : la garde refuse le passage sous zéro, elle ne prévient pas qu'on s'en approche

## Cas d'erreur

- la sortie demandée dépasse ce qui reste : le mouvement est refusé, la quantité reste inchangée, et le motif indique la quantité actuelle et la décrémentation demandée
- le produit visé n'existe plus au catalogue : le mouvement est refusé et le motif indique que le produit d'or d'investissement est introuvable

## Brief produit

### Purpose

Garantir que le disponible affiché est un disponible réel, et rendre l'échec compréhensible au comptoir plutôt qu'illisible.

### User

Le vendeur au comptoir, qui encaisse, sert une vente depuis la réserve et reçoit le refus s'il en manque. Le propriétaire, qui répond de l'exactitude de l'inventaire et de la comptabilité matière.

### Content

Toutes les variations de quantité passent par la même garde, quel que soit l'écran qui les déclenche : encaissement d'un rachat, service d'une vente depuis la réserve, réception d'un bon de commande. Deux refus sont possibles, avec leurs messages : « Stock insuffisant : quantité actuelle = 3, décrémentation demandée = 5 » et « Produit or investissement introuvable ». Par ailleurs, l'écran de service d'une vente affiche le disponible et ne laisse pas servir depuis la réserve plus que ce disponible : le refus est un filet, pas le fonctionnement normal.

## Notes techniques

Contrainte `or_investissement_quantite_non_negative CHECK (quantite >= 0)` posee par `supabase/migrations/087_or_investissement_no_negative_qty.sql`, qui reecrit aussi la RPC `increment_or_invest_quantite(p_id UUID, p_qty INT)` introduite en `010_rpc_increment_or_invest.sql`. La fonction est `SECURITY DEFINER SET search_path = public` ; elle fait `SELECT quantite INTO v_current ... FOR UPDATE` (verrou de ligne contre les mouvements concurrents), `RAISE EXCEPTION 'Produit or investissement introuvable (id: %)'` si `v_current IS NULL`, puis `RAISE EXCEPTION 'Stock insuffisant : quantité actuelle = %, décrémentation demandée = %', v_current, abs(p_qty)` si `v_current + p_qty < 0`, avant l'`UPDATE`.

Appelants constates : `reglement-dialog.tsx:148` et `stock-operations.ts:75` (incrementation apres paiement d'un rachat, `p_qty = ref.quantite`), `commande-ref-table.tsx:194` et `:210` (decrementation au service depuis le stock, `p_qty: -stockEntry.quantite`), `commande-detail-page.tsx:203` et `:216` (reception d'un bon de commande). Le plafonnement cote ecran est `Math.min(ligne.stock_disponible, ligne.quantite)` (`commande-ref-table.tsx:127`, repris en `:164` et `:428`).
