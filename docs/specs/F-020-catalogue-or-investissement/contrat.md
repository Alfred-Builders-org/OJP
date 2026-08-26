---
id: F-020
---

## Criteres d'acceptation

### AC-001 : Le propriétaire décrit un produit une fois et le catalogue le reprend partout

**Given** un produit « Napoléon 20 francs », métal Or, poids 6,45 g, titre 900, pays France, millésimes 1907, quantité 3
**When** le propriétaire ouvre la fiche du produit, porte la quantité à 5 et enregistre
**Then** la liste des produits d'investissement, triée par désignation, montre le Napoléon 20 francs avec une quantité de 5, et la recherche du formulaire de référence le retrouve par sa désignation, son métal ou son pays

anchoring: [PER-001]
recette: [RS-020-01, RS-020-02]

### AC-002 : Un vendeur consulte le catalogue mais ne le modifie pas

**Given** un catalogue de 42 produits d'investissement, affichés 20 par page, consulté par un vendeur au comptoir
**When** le vendeur ouvre la fiche du lingot de 1 kg
**Then** il voit la désignation, le poids, le métal, le titre, le pays, les millésimes, le prix de revente et la quantité, et aucune modification ne lui est proposée ni acceptée

anchoring: [PER-002]
recette: [RS-020-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-020-01 | créer puis modifier en propriétaire un produit « Napoléon 20 francs » en Or, 6,45 g, titre 900, France, 1907, et porter sa quantité de 3 à 5 | manuel |
| RS-020-02 | vérifier que la liste est triée par désignation et que la recherche du formulaire de référence retrouve ce produit par désignation, métal et pays | manuel |
| RS-020-03 | ouvrir le catalogue avec un compte vendeur, consulter la fiche d'un lingot de 1 kg et vérifier qu'aucune modification n'est possible | manuel |
