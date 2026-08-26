---
id: F-022
---

## Criteres d'acceptation

### AC-001 : Un bijou racheté puis revendu porte une taxe assise sur la seule marge

**Given** un bijou racheté 7 000,00 € au client et proposé à la revente à 9 000,00 €
**When** le vendeur l'ajoute à la vente depuis la recherche du stock
**Then** la ligne est créée à 9 000,00 € et porte une taxe de 400,00 €, calculée sur les 2 000,00 € de marge et non sur le prix de vente entier

anchoring: [R-007, PER-002]
recette: [RS-022-01]

### AC-002 : Une ligne d'or d'investissement dit ce qui est servi et ce qui reste à commander

**Given** un produit d'or d'investissement du catalogue, retenu en quantité 3 au prix unitaire de 2 150,00 €
**When** le vendeur ajoute ce produit à la vente depuis le catalogue
**Then** la ligne est créée pour 6 450,00 € et reste en attente d'affectation, tant que le vendeur n'a pas dit si elle est servie du disponible ou à commander à une fonderie

anchoring: [R-011, PER-002]
recette: [RS-022-02]

### AC-003 : Le récapitulatif de la vente suit ses lignes sans être ressaisi

**Given** une vente portant une ligne de bijou à 9 000,00 € taxée 400,00 € et une ligne d'or d'investissement à 6 450,00 € non taxée
**When** le vendeur retire la ligne de bijou de la vente
**Then** le récapitulatif affiche « Total articles » à 6 450,00 €, « Total taxes » à 0,00 € et « Total TTC » à 6 450,00 €, sans que personne ait eu à recalculer

anchoring: [R-044, PER-002]
recette: [RS-022-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-022-01 | ajouter à la vente un bijou du stock racheté 7 000,00 € et revendu 9 000,00 € produit une taxe sur marge de 400,00 € | test:src/lib/calculations/taxes.test.ts::calcule 20% sur la marge positive |
| RS-022-02 | ajouter à la vente 3 unités d'un produit d'or d'investissement à 2 150,00 € l'unité crée une ligne de 6 450,00 € en attente d'affectation | manuel |
| RS-022-03 | retirer la ligne de bijou de 9 000,00 € ramène le total TTC affiché de la vente à 6 450,00 € | manuel |
