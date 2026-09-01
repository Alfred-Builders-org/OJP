---
id: F-006
slug: numerotation-automatique
title: Numéroter automatiquement dossiers, lots et documents sans doublon
epic: E-002
domaine: [DOM-003, DOM-004, DOM-012]
surface: standard
dependencies: none
personas: [PER-002, PER-001]
---

# Objectif

Chaque dossier, lot, facture et document reçoit à sa création un numéro lisible de la forme DOS-2026-0001, propre à son type et à l'année en cours. Deux saisies faites au même instant ne peuvent pas obtenir le même numéro.

## Intention

Un numéro de pièce n'est pas un détail d'affichage : c'est ce que le client lit sur son devis, ce que le comptable retrouve dans ses livres, et ce que le vendeur cite au téléphone. Il doit être court, prononçable, et dire de quoi il s'agit sans ouvrir la pièce : le préfixe donne le type, l'année donne l'exercice, le rang donne l'ordre d'émission.

Personne ne le saisit. Le vendeur ne devrait jamais avoir à chercher quel était le dernier numéro utilisé, ni à se demander si son collègue en a pris un pendant qu'il remplissait son écran. Deux quittances qui portent le même numéro ne sont pas un désagrément : c'est une anomalie comptable qu'on ne découvre qu'au contrôle, des mois plus tard, sans pouvoir dire laquelle des deux était la bonne.

La remise à zéro au 1er janvier suit la façon dont le comptoir range ses pièces : un classeur par exercice, et un rang qui repart de 1 dans chaque classeur.

## Hors-scope

- le contenu et la mise en page des pièces émises, qui appartiennent au périmètre des documents
- le réglage des préfixes, qui se fait dans les paramètres de l'application
- la reprise d'un numéro déjà attribué : une pièce annulée garde le sien, il n'est jamais rendu au compteur

## Cas d'erreur

- deux vendeurs demandent un numéro du même type à la même seconde : chacun en reçoit un distinct, et le même rang n'est jamais servi deux fois

## Brief produit

### Purpose

Donner à toute pièce du comptoir une identité stable, unique et lisible dès l'instant de sa création, sans que personne n'ait à la choisir ni à vérifier qu'elle est libre.

### User

Le vendeur au comptoir, qui cite un numéro au client et le retrouve à son retour. Le propriétaire, qui rapproche les pièces de sa comptabilité et doit pouvoir affirmer qu'aucun rang ne se répète.

### Content

Un préfixe par type de pièce : DOS pour les dossiers, RAC, VEN et DPV pour les lots selon qu'il s'agit d'un rachat, d'une vente ou d'un dépôt-vente, FAC pour les factures, BDC pour les bons de commande, BDL pour les bons de livraison, et un préfixe dédié pour chaque type de document contractuel. Ensuite l'année sur 4 chiffres, puis le rang sur 4 chiffres, complété par des zéros à gauche : DOS-2026-0001, RAC-2026-0042.

## Notes techniques

Un trigger par table, posé en `022_rename_numeros.sql` et durci en `055_fix_numero_race_condition.sql` : chaque fonction `generate_*_numero` prend un `pg_advisory_xact_lock(hashtext('<nom>_numero'))` avant de calculer `MAX(...) + 1` filtré sur l'année courante, ce qui sérialise l'attribution sans verrouiller la table. Le trigger ne s'arme que si `numero` est NULL ou vide : `src/lib/pdf/generate-and-store.ts` réserve d'abord la ligne `documents` avec `numero: ""` pour obtenir un numéro atomiquement, relit la valeur attribuée, puis produit le PDF avec ce numéro. Les préfixes des documents peuvent être surchargés par `settings.document_prefixes`, mais seule `generateAndStoreBonLivraison` lit réellement ce réglage aujourd'hui. Voir aussi `035_create_bons_commande.sql`, `049_create_bons_livraison.sql` et `133_document_remboursement_retractation.sql` pour les séquences ajoutées après coup.
