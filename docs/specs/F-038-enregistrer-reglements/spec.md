---
id: F-038
slug: enregistrer-reglements
title: Enregistrer les encaissements et décaissements rattachés à une opération
epic: E-014
surface: risquee
domaine: [DOM-004, DOM-013]
dependencies: [F-005]
personas: [PER-002, PER-001]
---

# Objectif

Tout mouvement d'argent est rattaché à un lot, avec son sens, son montant, son moyen de paiement et sa date. Une opération sait ainsi à tout instant ce qu'elle a encaissé, ce qu'elle a versé, et ce qui reste dû.

## Intention

Un comptoir de rachat manipule de l'argent dans les deux sens toute la journée : on verse au client qui vend son or, on encaisse celui qui achète, on reverse au déposant, on paie la fonderie. Tant que ces mouvements ne sont notés nulle part, personne ne peut dire en fin de journée si un client a été payé deux fois, ou pas du tout, et le doute se règle de mémoire.

Attacher chaque mouvement à l'opération qui le justifie change deux choses. Le vendeur voit, au moment où il encaisse, ce qui était attendu et ce qui restera après lui : il ne calcule plus de tête. Le propriétaire lit le grand livre d'un dossier et retrouve, ligne à ligne, d'où vient chaque euro entré et sorti, sans avoir à croiser des tickets de caisse avec des pièces contractuelles.

L'autre effet est protecteur. Le montant versé n'a pas à être ressaisi ailleurs pour que l'opération se mette à jour : l'enregistrement du règlement suffit, et son retrait défait ce qu'il avait fait. C'est ce qui empêche un lot d'afficher un acompte payé alors que le règlement correspondant a été supprimé.

## Hors-scope

- la fixation du montant attendu : elle est décidée par le chiffrage et par les pièces contractuelles, ce périmètre ne fait que constater ce qui a été payé face à elle
- le parcours de rétractation lui-même : ici on n'enregistre que la trace du remboursement, pas la décision du client ni la reprise des articles
- la comptabilité de l'entreprise, ses écritures et ses rapprochements bancaires

## Cas d'erreur

- aucun moyen de paiement n'est choisi, le champ étant resté sur « Choisir un mode » : rien n'est enregistré et le vendeur lit « Le mode de règlement est requis. »
- le montant saisi est nul, vide ou négatif : rien n'est enregistré et le vendeur lit « Le montant doit être positif. »

## Brief produit

### Purpose

Faire exister chaque euro qui entre ou qui sort comme une ligne rattachée à une opération, pour que le reste dû soit une lecture et non un calcul.

### User

Le vendeur au comptoir, qui encaisse et qui verse au moment où le client est devant lui. Le propriétaire, qui relit un dossier pour savoir ce qui a été payé, quand, et par quel moyen.

### Content

Avant la saisie, un récapitulatif à trois lignes : « Montant attendu », « Déjà réglé », « Reste à régler ». La saisie porte le montant, le mode de règlement (Espèces, Carte bancaire, Virement, Chèque), la date du règlement et une note libre pour une référence ou un commentaire. Un règlement enregistré peut être supprimé, et ce retrait défait ce qu'il avait reporté sur l'opération.

Au niveau du dossier, une carte récapitulative et un grand livre à colonnes Libelle, Date, Entrees et Sorties, clos par « Total encaisse », « Total decaisse » et « Solde net ».

## Notes techniques

Chaque mouvement est une ligne de `reglements` rattachée à un `lot_id` en suppression en cascade (`036_create_reglements.sql`), avec `sens`, `type`, `montant`, `mode`, `date_reglement` et, selon le cas, `client_id`, `fonderie_id`, `bon_commande_id`, `document_id` (le type `depot_vente` est ajouté par `046_reglement_type_depot_vente.sql`).

Le report sur le lot est tenu par le déclencheur `sync_reglement_to_lot`, corrigé en `045_fix_reglement_sync_trigger.sql` pour couvrir aussi la suppression et la mise à jour : sur ces deux opérations, `acompte_paye`, `solde_paye`, `mode_reglement` et les dates sont réévalués depuis les lignes restantes, jamais écrits par l'application (R-044).

Le refus de payer sur une opération close est tenu en base par `bloquer_reglement_operation_sans_suite` (`135_*.sql`, R-014) ; le dialogue relaie tel quel le message de la base lorsqu'il contient « operation est close ». Le remboursement de rétractation passe par le type de document `remboursement_retractation` (`133_*.sql`, R-015).

Écrans concernés : `src/components/reglements/reglement-dialog.tsx`, `reglements-card.tsx`, `dossier-reglements-card.tsx`, `dossier-recap-financier.tsx`.
