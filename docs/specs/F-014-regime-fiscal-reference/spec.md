---
id: F-014
slug: regime-fiscal-reference
title: Choisir le régime fiscal d'une référence rachetée et calculer la taxe due
epic: E-005
surface: risquee
domaine: [DOM-005]
dependencies: [F-007, F-015]
personas: [PER-002, PER-001]
---

# Objectif

Retenir pour chaque objet racheté le régime le moins coûteux pour le client, entre la plus-value et le forfait applicable à la nature de l'objet. Le montant dû est chiffré et conservé sur la référence, objet par objet.

## Intention

La fiscalité du rachat est le point où une erreur coûte de l'argent à quelqu'un : au client si on lui applique d'office le forfait alors qu'il pouvait payer moins, à la maison si on lui applique un taux qui n'est pas le sien. Le bon régime n'est pas évident à l'oeil, parce qu'il dépend à la fois de la nature de l'objet, du montant de la cession, de l'ancienneté de la détention et des justificatifs apportés.

L'application fait donc le calcul à la place du vendeur et affiche les deux régimes côte à côte, en signalant celui qui est retenu. Le vendeur n'a plus à arbitrer, il annonce un montant net que le client peut vérifier. Le propriétaire, lui, sait que chaque ligne du comptoir porte un régime justifiable si l'administration le demande.

Le choix se fait ligne par ligne et non lot par lot : deux objets apportés le même jour par le même client peuvent relever de régimes différents.

## Hors-scope

- la vérification des quatre justificatifs qui ouvrent le régime de la plus-value : elle est tenue séparément, et cette feature ne fait que consommer son résultat
- la taxe sur la valeur ajoutée d'une revente, qui relève de la sortie d'un article et non du rachat
- le reversement à l'administration : le comptoir prépare le montant, il ne déclare pas à la place du propriétaire

## Cas d'erreur

- la cession d'un bijou ne dépasse pas 5 000 euros : la taxe forfaitaire tombe à zéro et l'écran affiche « Exonéré (≤ 5 000 €) » au lieu d'un montant
- le client détient l'objet depuis vingt-deux ans révolus : la plus-value est intégralement exonérée, son montant tombe à zéro, et c'est ce régime nul qui est retenu

## Brief produit

### Purpose

Rendre le régime fiscal d'un rachat opposable et le moins cher possible pour le client : le comparatif est calculé, affiché et conservé sur l'objet, pas laissé à l'appréciation du vendeur.

### User

Le vendeur au comptoir, qui enregistre l'objet et annonce le montant net au client. Le propriétaire, qui répond de la fiscalité de la maison et pour qui une erreur de régime est le risque le plus coûteux du comptoir.

### Content

Pour chaque référence : le prix de rachat, le régime forfaitaire applicable à sa nature (métaux précieux pour l'or d'investissement, objets précieux pour les bijoux), la plus-value quand elle est ouverte, le régime retenu et le montant de la taxe. Les deux lignes du comparatif sont visibles, celle qui est retenue est signalée par une coche. À montant égal, c'est le régime forfaitaire qui l'emporte, parce qu'il ne demande aucun justificatif à conserver.

La quittance remise au client nomme la taxe selon le régime retenu : taxe sur les métaux précieux, taxe forfaitaire sur les objets précieux, ou taxe sur la plus-value.

## Notes techniques

Les cinq calculs vivent dans `src/lib/calculations/taxes.ts` : `calculerTMP`, `calculerTFOP`, `calculerTPV`, puis les deux arbitres `regimeFiscalOptimal` (or d'investissement) et `regimeFiscalOptimalBijoux` (bijoux). La colonne `lot_references.regime_fiscal` accepte `TPV`, `TMP` ou `TFOP` depuis la migration `120_add_tfop_regime_fiscal.sql`, sur la table créée par `009_create_lots.sql`. La référence persiste `tpv_eligible`, `tpv_montant`, `tmp_montant`, `regime_fiscal` et `montant_taxe`, ce dernier ramené à l'unité (optimal divisé par la quantité). Les formulaires `reference-form-bijoux.tsx` et `reference-form-or-invest.tsx` rendent le comparatif. L'étiquetage sur la quittance se fait dans `finalize-actions.ts`.

Tous les montants sont arrondis à deux décimales, et un montant non fini ou négatif est ramené à zéro avant calcul.
