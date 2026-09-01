---
id: F-010
slug: reponse-au-devis
title: Enregistrer l'acceptation ou le refus d'un devis par le client
epic: E-003
domaine: [DOM-004, DOM-005, DOM-012]
surface: standard
dependencies: [F-009]
personas: [PER-002, PER-004]
---

# Objectif

Tracer la réponse du client et faire basculer le lot vers la suite du parcours. Un oui ouvre la suite propre à chaque objet repris, un non ferme la ligne proprement.

## Intention

Entre l'envoi du devis et la réponse, l'affaire est en suspens : le vendeur ne sait pas ce qu'il doit préparer, et rien n'indique au comptoir ce qui attend encore une décision. Consigner la réponse remet chaque objet sur son rail : un bijou accepté entre dans le délai légal de réflexion avec son contrat, un lingot accepté part directement en attente de paiement avec sa quittance. Un refus, lui, doit fermer la ligne au lieu de la laisser traîner : le devis est marqué refusé, l'opération se clôt sur cette issue, et elle cesse d'apparaître dans ce qui reste à faire.

## Hors-scope

- l'émission du devis et l'annonce de sa durée de validité
- le décompte du délai de rétractation qu'ouvre une acceptation de bijoux
- l'encaissement ou le versement des sommes qui découlent de la réponse
- la réponse saisie par le client lui-même : elle est toujours rapportée par le vendeur, qui l'a reçue au comptoir, au téléphone ou par courriel

## Cas d'erreur

- le client revient sur son refus : l'opération est déjà fermée sur l'issue « refusé » et plus aucune réponse ne peut y être enregistrée, il faut reprendre l'expertise depuis le début

## Brief produit

### Purpose

Faire de la réponse du client un fait enregistré, qui déplace l'affaire au lieu de la laisser en attente indéfinie.

### User

Le vendeur au comptoir, qui reçoit la réponse et la rapporte. Le client particulier, dont la décision doit être suivie d'effet sans qu'il ait à la répéter.

### Content

Tant qu'un objet attend une réponse, l'opération propose deux gestes : l'un porte le numéro du devis et rappelle qu'on attend le client, l'autre enregistre le refus. Le refus se confirme dans une fenêtre intitulée « Refuser le devis ». À l'acceptation, chaque objet suit sa nature : un bijou entre en délai de rétractation avec son contrat de rachat, un produit d'or d'investissement passe en attente de paiement avec sa quittance. Quand tous les objets d'une opération sont arrivés au bout, l'opération se ferme, avec l'issue « refusé » si tout a été refusé.

## Notes techniques

Le registre d'actions expose `lot.accepter_devis` et `lot.refuser_devis` dès qu'un lot `en_cours` porte des références en `devis_envoye` (`src/lib/actions/action-registry.ts:64-96`). `executeAccepterDevisLot` et `executeRefuserDevisLot` vivent dans `src/lib/actions/lot-actions.ts` ; l'acceptation bascule les bijoux en `en_retractation` avec `date_envoi`/`date_fin_delai`, les références d'or d'investissement en `en_attente_paiement`, passe les documents `devis_rachat` du lot en `status = 'accepte'` et déclenche le courriel interne `interne_devis_accepte`. Le refus passe les références en `devis_refuse` et les documents en `status = 'refuse'`. Les deux appellent `checkAndFinalizeLot` (`src/lib/actions/reference-actions.ts:13-56`), qui passe le lot en `finalise` avec `outcome = 'refuse'`, `'retracte'` ou `'complete'` selon les statuts terminaux, puis finalise le dossier si tous ses lots le sont. La confirmation de refus est le dialogue de `src/components/lots/reference-card.tsx:156`.
