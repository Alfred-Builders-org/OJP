---
id: F-015
slug: eligibilite-plus-value
title: Vérifier l'éligibilité à la taxe sur la plus-value avant de la proposer
epic: E-005
surface: risquee
domaine: [DOM-005]
dependencies: [F-007]
personas: [PER-002, PER-004]
---

# Objectif

Le régime de la plus-value n'est ouvert que si le client réunit quatre justificatifs : facture à son nom, justificatif d'achat, date d'acquisition et prix d'acquisition. Tant qu'il en manque un, seul le régime forfaitaire est proposé.

## Intention

Le client a le droit d'opter pour la plus-value, mais ce droit se prouve. Sans le prix et la date d'acquisition, il n'y a tout simplement pas de plus-value à calculer ; sans la facture à son nom ni les scellés intacts, rien n'établit que l'objet posé sur le comptoir est bien celui qui a été acheté à ce prix.

L'enjeu est de ne pas mettre le vendeur en position d'arbitrer sous la pression du client. Les quatre conditions sont posées comme quatre saisies, et l'application décide seule si la ligne plus-value a le droit d'apparaître dans le comparatif. Quand elle n'apparaît pas, le vendeur a une réponse simple à donner : il manque telle pièce.

Les justificatifs se saisissent objet par objet, sur la référence, et non sur le lot : deux bijoux du même client peuvent relever de régimes différents parce que l'un est documenté et l'autre non.

## Hors-scope

- le chiffrage de la plus-value elle-même et son arbitrage face au forfait, qui se jouent une fois l'éligibilité acquise
- le stockage d'une copie de la facture d'acquisition : le vendeur atteste l'avoir vue, il ne la numérise pas ici
- le client professionnel, dont le rachat ne relève pas de ce régime

## Cas d'erreur

- la facture au nom du client n'est pas cochée : la ligne du comparatif affiche « Non éligible » et seul le régime forfaitaire reste proposé
- la date d'acquisition est laissée vide alors que les trois autres justificatifs sont réunis : la plus-value reste fermée, parce que les quatre conditions sont cumulatives

## Brief produit

### Purpose

Faire de l'éligibilité à la plus-value une décision de l'application et non du vendeur : quatre cases à réunir, un verdict affiché, aucune place pour l'appréciation au comptoir.

### User

Le vendeur au comptoir, qui saisit ce que le client lui présente et doit pouvoir expliquer un refus. Le client particulier, qui veut savoir à quelles conditions il peut opter pour la plus-value.

### Content

Quatre saisies portées par la référence : la case « Facture au nom du client », la case « Justificatif d'achat », la « Date d'acquisition » et le « Prix d'acquisition (€) ». Le verdict d'éligibilité est conservé sur la référence, aux côtés du régime retenu. Quand une condition manque, le comparatif affiche « Non éligible » à la place du montant de plus-value.

## Notes techniques

Le prédicat est `isTPVEligible(hasFacture, isScelle, dateAcquisition, prixAcquisition)` dans `src/lib/calculations/taxes.ts` : il exige les deux booléens vrais, une date non nulle et non vide, et un prix non nul et strictement positif. Le résultat est persisté dans `lot_references.tpv_eligible`, colonne posée avec les trois autres par `009_create_lots.sql`. Les deux formulaires `reference-form-bijoux.tsx` et `reference-form-or-invest.tsx` conditionnent l'affichage de la ligne plus-value à ce booléen et rabattent `regime_fiscal` sur `TMP` ou `TFOP` sinon. Cinq cas vitest couvrent le prédicat dans `taxes.test.ts`.
