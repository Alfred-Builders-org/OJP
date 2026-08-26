---
id: ADR-016
title: Rendre la porte d'intégration continue bloquante sur les deux branches
status: accepted
---

## Contexte

Le produit est livré à un client et développé par une équipe réduite ; une régression poussée sans contrôle se découvre en boutique.

## Décision

Une porte d'intégration continue exécute l'analyse statique, la vérification de types avec la compilation, puis les tests de bout en bout, sur toute proposition de fusion vers la branche principale ou vers staging, ainsi que sur tout envoi vers staging. Le rapport de test est conservé en cas d'échec.

## Conséquences

Aucune fusion ne passe sans que le produit compile et que les parcours critiques répondent. Les tests demandent des secrets d'environnement, tenus au niveau du dépôt.

## Alternatives

Une porte non bloquante aurait été ignorée dès la première urgence.
