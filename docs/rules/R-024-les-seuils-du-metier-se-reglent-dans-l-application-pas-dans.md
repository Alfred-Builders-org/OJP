---
id: R-024
title: Les seuils du métier se règlent dans l'application, pas dans le code
statement: Les treize seuils métier (délai de rétractation, validité du devis, part d'acompte et de solde, délai de solde, commission de dépôt-vente, durée de contrat, préavis de résiliation, pénalité de retrait, forfait de nettoyage, frais de garde, délai de paiement du déposant, seuil d'alerte d'identité) sont stockés en base et modifiables depuis l'écran des paramètres.
enforcement: advisory
surface: parametrage
priority: 2
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-047
---

## Où elle est tenue

`src/types/settings.ts`, interface `BusinessRulesSettings`. Les valeurs vivent en base et se modifient depuis l'écran des paramètres.

Les treize : délai de rétractation, validité du devis, part d'acompte, part de solde, délai de solde, commission de dépôt-vente, durée de contrat, préavis de résiliation, pénalité de retrait, forfait de nettoyage, frais de garde mensuels, délai de paiement du déposant, seuil d'alerte d'identité.

## Pourquoi

Ces valeurs changent au rythme du métier et de la réglementation, pas à celui du code. Les inscrire en dur imposerait une livraison à chaque ajustement, et le propriétaire dépendrait d'un tiers pour un réglage qui lui appartient.

C'est aussi ce qui rend les règles de délai lisibles : [R-016](R-016-une-vente-dont-le-solde-n-arrive-pas-s-annule-d-elle-meme.md) parle d'une échéance sans la chiffrer, parce que le chiffre est ici.
