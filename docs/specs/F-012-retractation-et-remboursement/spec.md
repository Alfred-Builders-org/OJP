---
id: F-012
slug: retractation-et-remboursement
title: Enregistrer la rétractation d'un client et le remboursement de ce qu'il a perçu
epic: E-004
domaine: [DOM-004, DOM-012, DOM-013]
surface: risquee
dependencies: [F-011, F-038]
personas: [PER-002, PER-004]
---

# Objectif

En boutique le client repart souvent payé le jour même ; s'il se rétracte, le retour de la somme doit laisser une trace comptable. La rétractation ferme l'affaire et défait ce qui avait été engagé, argent compris.

## Intention

Un client qui se rétracte reprend sa marchandise et rend l'argent qu'il a touché. Sans enregistrement, cette somme rendue n'existe nulle part : la caisse dit qu'on a versé et ne dit jamais qu'on a repris, et l'affaire reste comptée comme un rachat payé alors qu'elle n'a produit ni or ni dépense nette. En inscrivant le retour comme un mouvement de sens opposé du même rachat, le total de l'affaire retombe à zéro tout seul, et le reçu remis au client prouve qu'il a bien rendu ce qu'il devait. Le contrat de rachat, lui, est marqué annulé : il ne peut plus être présenté comme un engagement en vigueur.

## Hors-scope

- l'ouverture et le décompte du délai de rétractation, tenus par la capacité voisine
- la restitution physique de la marchandise au client, qui se traite au comptoir sans trace dans l'application
- le blocage d'un versement au client sur une affaire déjà close
- la rétractation demandée par le client depuis l'extérieur : elle est toujours rapportée par le vendeur

## Cas d'erreur

- le client se rétracte sans avoir été payé, ou pour une somme inférieure à un centime : la rétractation est enregistrée et aucun reçu de remboursement n'est produit
- l'inscription du remboursement échoue : la rétractation est tout de même enregistrée et l'affaire fermée, sans que rien ne signale au comptoir que la somme rendue n'a pas été portée en caisse

## Brief produit

### Purpose

Faire du retour d'argent un fait enregistré et prouvé, au lieu d'un arrangement de comptoir dont il ne reste rien.

### User

Le client particulier, qui exerce son droit de revenir sur sa décision et veut une preuve de ce qu'il a rendu. Le vendeur au comptoir, qui doit fermer l'affaire proprement.

### Content

Le geste de rétractation passe tous les objets encore en délai à l'état rétracté et ferme l'affaire sur l'issue « rétracté ». Si le client avait déjà été payé, un reçu de remboursement numéroté est émis, un mouvement d'argent de même montant et de sens opposé est inscrit, dans le moyen de paiement du dernier versement, avec la note « Remboursement suite à rétractation du client (contrat {numéro}) ». Le contrat de rachat passe annulé. Une alerte interne prévient le comptoir qu'une rétractation vient d'être enregistrée.

## Notes techniques

`executeRetracterLot` (`src/lib/actions/lot-actions.ts:194-227`) capture les références en `en_retractation` ou `bloque`, les passe à `retracte`, appelle `rembourserSiDejaPaye`, déclenche le courriel `interne_retractation` puis `checkAndFinalizeLot`, qui pose `outcome = 'retracte'`. `rembourserSiDejaPaye` (`lot-actions.ts:237-298`) additionne les règlements de type `rachat` du lot ; au delà d'un centime, il génère un document `remboursement_retractation` (préfixe `RBT`, `supabase/migrations/133_document_remboursement_retractation.sql`), insère un règlement `sens: 'sortant'`, `type: 'rachat'`, montant `-montantRembourse`, mode repris du dernier versement (défaut `especes`), puis passe le contrat de rachat en `status = 'annule'`. Un échec est journalisé (`console.error("[RETRACTATION] Remboursement non enregistré :", err)`) sans interrompre la rétractation. Le paiement anticipé pendant le délai vient de `src/lib/reglements/detect-payments-due.ts:130-172`.
