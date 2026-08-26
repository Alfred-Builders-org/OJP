---
id: F-021
---

## Criteres d'acceptation

### AC-001 : Les mouvements légitimes ajustent la quantité du produit catalogué

**Given** un produit « Napoléon 20 francs » dont la quantité au catalogue est de 3
**When** le vendeur encaisse le paiement d'un rachat portant 2 pièces de ce produit
**Then** la quantité du produit au catalogue passe à 5

anchoring: [R-021, PER-002]
recette: [RS-021-01]

### AC-002 : Une sortie supérieure au disponible est refusée avec un motif chiffré

**Given** un produit « Napoléon 20 francs » dont la quantité au catalogue est de 3
**When** une sortie de 5 pièces de ce produit est demandée pour servir une vente depuis la réserve
**Then** le mouvement est refusé, la quantité reste à 3, et le motif affiché est « Stock insuffisant : quantité actuelle = 3, décrémentation demandée = 5 »

anchoring: [R-021, PER-002]
recette: [RS-021-02, RS-021-03]

### AC-003 : Un mouvement sur un produit absent du catalogue est refusé

**Given** un produit d'or d'investissement retiré du catalogue par le propriétaire le 5 mai 2026
**When** un mouvement de stock de 2 pièces est demandé sur ce produit
**Then** le mouvement est refusé et le motif affiché indique que le produit d'or d'investissement est introuvable

anchoring: [R-021, PER-001]
recette: [RS-021-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-021-01 | encaisser le paiement d'un rachat portant 2 Napoléon 20 francs et vérifier que la quantité du produit passe de 3 à 5 | manuel |
| RS-021-02 | demander une sortie de 5 pièces sur un produit qui n'en compte que 3 et vérifier le message « Stock insuffisant : quantité actuelle = 3, décrémentation demandée = 5 » | manuel |
| RS-021-03 | vérifier qu'après ce refus la quantité du produit est toujours de 3 et que l'écran de service ne propose pas de servir plus que le disponible | manuel |
| RS-021-04 | demander un mouvement de stock sur un produit supprimé du catalogue et vérifier que le refus indique un produit introuvable | manuel |
