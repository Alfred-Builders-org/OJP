---
id: F-020
slug: catalogue-or-investissement
title: Tenir le catalogue des produits d'or d'investissement et leurs stocks
epic: E-007
domaine: [DOM-007]
surface: standard
dependencies: none
personas: [PER-001, PER-002]
---

# Objectif

Lingots et pièces sont des produits catalogués, au poids connu, comptés en quantité. La maison les décrit une fois pour toutes, et tous les écrans qui en ont besoin puisent dans cette même liste.

## Intention

Un Napoléon de 20 francs est toujours le même Napoléon : même poids, même titre, même pays, et le seul millésime change. Redécrire ce produit à chaque opération est une perte de temps et une source d'erreur, d'autant que la moindre variation de libellé casse ensuite les regroupements et le comptage. Ce qui distingue deux exemplaires, ce n'est pas leur description, c'est leur nombre.

Le catalogue tranche cela : la description est écrite une fois, elle appartient à la maison, et c'est le propriétaire qui la tient. Le vendeur, lui, la consulte et la choisit ; il n'a ni à la saisir ni à la corriger devant le client, et il ne peut pas l'altérer par mégarde en pleine opération.

La quantité vit sur la même ligne que la description, parce qu'elle est la seule vérité du disponible : ce qu'un écran de vente ou de commande peut promettre est ce que le catalogue affiche.

## Hors-scope

- la garantie que la quantité ne descende pas sous zéro et la mécanique des mouvements de stock, tenues à part
- la vente, la réservation et la livraison de ces produits, qui relèvent du périmètre des ventes
- la commande à une fonderie de ce qui manque au catalogue, qui relève de la filière fonderie
- les bijoux repris au comptoir, uniques et non catalogués, tenus sur leur propre inventaire

## Cas d'erreur

- un vendeur ouvre la fiche d'un produit du catalogue : la modification ne lui est pas proposée, et le refus tient même s'il tente d'écrire autrement que par l'écran

## Brief produit

### Purpose

Décrire une fois pour toutes les produits standards que la maison achète et revend, et donner à tous les écrans une source unique pour les proposer et les compter.

### User

Le propriétaire, seul à décrire et corriger les produits. Le vendeur, qui les consulte, les cherche et les choisit pendant une opération.

### Content

Chaque produit porte une désignation, un poids, un métal parmi Or, Argent et Autres, un titre, un pays, des millésimes, un prix de revente et une quantité. La liste est triée par désignation et paginée. La fiche s'édite sur place, champ par champ. Le catalogue alimente aussi la recherche du formulaire de référence d'un rachat, où l'on cherche sur la désignation, le métal ou le pays, ainsi que le sélecteur de produit d'une vente.

## Notes techniques

Table `or_investissement` : `designation` (NOT NULL), `poids NUMERIC(10,2)`, `metal` contraint a `Or | Argent | Autres` depuis la migration `006_add_pays_annees_or_investissement.sql` (`005_create_or_investissement.sql` posait `OR | ARGENT | AUTRES`), `titre`, `quantite INTEGER NOT NULL DEFAULT 0`, `pays`, `annees`, puis `prix_achat` et `prix_revente` ajoutes par `012_add_prix_or_investissement.sql`. Trigger `set_updated_at`.

`src/app/(dashboard)/or-investissement/page.tsx` lit le role dans `profiles`, compte en `head: true`, ordonne par `designation` ascendant et applique `range(from, to)` sur `?page=&size=` (defaut 20). `canEdit` vaut `role === "proprietaire" || role === "super_admin"`. Cote base, les policies `or_investissement_insert/update/delete` exigent `user_role() = 'proprietaire'`, la policy de lecture restant ouverte a tout utilisateur actif : l'interface est le second rideau, la base est la garde.

`or-investissement-detail-page.tsx` edite en place via `DetailRow` ; la quantite est un champ numerique libre (`:236`), sans plafond ni plancher cote formulaire. Les consommateurs du catalogue sont le popover cherchable du formulaire de reference et `or-invest-picker-form.tsx` cote vente.
