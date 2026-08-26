---
id: F-027
slug: reversement-deposant
title: Reverser au déposant sa part quand son article est vendu
epic: E-009
surface: risquee
domaine: [DOM-010, DOM-012, DOM-013]
dependencies: [F-022, F-026, F-038]
personas: [PER-002, PER-004]
---

# Objectif

Quand un article confié en dépôt-vente trouve preneur, le déposant reçoit une quittance qui chiffre sa part, commission déduite. Le montant à lui verser se présente ensuite de lui-même au suivi des règlements.

## Intention

La vente d'un article en dépôt-vente crée une dette au moment même où elle crée une recette. L'acheteur paie le comptoir, mais l'essentiel de cette somme appartient à quelqu'un d'autre, et rien dans l'encaissement ne le rappelle. Sans reprise automatique, la part du déposant se retrouve confondue avec la marge de la maison et ne ressort qu'à la réclamation.

Le comptoir veut donc que la vente elle-même produise la pièce du déposant : une quittance à son nom, qui dit ce que l'article a rapporté au public, ce que la maison a retenu, et ce qui lui revient. Le propriétaire, de son côté, veut retrouver ce montant dans la même liste que ses autres échéances d'argent, du côté des sorties, sans avoir à le reconstituer article par article.

La quittance ne doit exister qu'une fois. Une vente rejouée ou reprise ne peut pas faire naître une seconde dette pour le même article : ce serait payer deux fois un déposant qui n'a déposé qu'une fois.

## Hors-scope

- l'encaissement de l'acheteur et la facture de vente, qui appartiennent au parcours de vente
- le versement effectif au déposant, qui s'enregistre comme n'importe quel règlement sortant
- la date à laquelle ce versement est dû : la capacité signale le montant, pas son échéance

## Cas d'erreur

- l'article vendu n'est rattaché à aucune référence de dépôt portant un prix net déposant : la part du déposant est ramenée à 60 % du prix de vente plutôt que d'être laissée vide
- une quittance de dépôt-vente couvre déjà les articles de cette vente : aucune seconde quittance n'est émise et la dette reste unique

## Brief produit

### Purpose

Faire naître la dette envers le déposant au moment de la vente, avec sa pièce justificative, et la porter à la vue de celui qui paie.

### User

Le client particulier, déposant, qui reçoit la quittance et attend son argent. Le propriétaire du comptoir, qui décaisse et suit ce qui reste dû.

### Content

Par article vendu : le prix de vente public, le net déposant et la commission retenue. En pied de quittance : le total des ventes, le total de commission et le total net déposant, ainsi que le numéro du dossier de vente d'origine.

## Notes techniques

`processVenteLot` (`finalize-actions.ts:626-727`) regroupe les lignes de vente dont le `bijoux_stock.depot_vente_lot_id` est renseigné par lot de dépôt-vente, calcule `netDeposant = lot_reference.prix_achat` avec repli `prixVente * 0.6`, `commission = prixVente - netDeposant`, puis émet la `quittance_depot_vente` (préfixe QDV) au nom du déposant. Le garde d'idempotence interroge `document_references` puis `documents` sur le type `quittance_depot_vente`. Les `bijoux_stock` passent en `vendu` et les `lot_references` liées aussi.

`detect-payments-due.ts:288-326` produit le paiement `{ type: 'depot_vente', sens: 'sortant' }` libellé `Quittance {numero} | Net déposant à verser`, avec `montant_attendu` = somme des `prix_achat * quantite` des références liées et `montant_restant` net des règlements de type `depot_vente` déjà rattachés au document (migration 046).

Le réglage `delai_paiement_deposant_jours` (défaut 15) existe dans `regles-metier-tab.tsx` mais n'est lu par aucun calcul d'échéance.
