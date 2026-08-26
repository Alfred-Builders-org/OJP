---
id: F-042
---

## Criteres d'acceptation

### AC-001 : Le chiffrage d'un bijou emploie le cours figé sur le lot, pas le cours du jour

**Given** un lot dont le cours de l'or a été figé à 65,000 euros le gramme et le coefficient de rachat à 0,85, et une bague de 10 grammes titrée 750 millièmes
**When** le vendeur saisit cette référence sur le lot
**Then** le prix de rachat proposé est 414,38 euros, obtenu sur le cours figé du lot même si le cours du jour a changé depuis

anchoring: [R-001, PER-002]
recette: [RS-042-01, RS-042-03]

### AC-002 : Le chiffrage d'un produit d'investissement emploie le cours figé et ignore le titre

**Given** un lot dont le cours de l'or a été figé à 65,000 euros le gramme et le coefficient d'achat à 0,95, et un lingot de 100 grammes repris au catalogue
**When** le vendeur saisit ce lingot sur le lot
**Then** le prix de rachat proposé est 6 175,00 euros, sans aucun facteur de titre

anchoring: [R-002, PER-002]
recette: [RS-042-02]

### AC-003 : Le cours figé se conserve au millième d'euro jusqu'au bon de livraison

**Given** un lot créé le 3 février 2026 avec l'argent figé à 1,644 euro le gramme, puis routé vers une fonderie
**When** le propriétaire ouvre la fiche du lot, puis la ligne du bon de livraison qui en est issue
**Then** la fiche affiche « Cours appliqués » avec la mention « figés à la création » et la valeur 1,644 euro le gramme, et la ligne du bon de livraison porte ce même cours au millième

anchoring: [R-019, PER-001]
recette: [RS-042-04]

### AC-004 : Un lot ouvert sans aucun cours relevé le dit au lieu de chiffrer à zéro en silence

**Given** un lot créé un jour où aucun cours n'avait été relevé, ses cours or et argent figés valant tous deux 0
**When** le vendeur ouvre la fiche de ce lot
**Then** la fiche annonce qu'aucun cours n'est associé au lot et que les prix proposés seront à zéro, et invite à renseigner les cours puis à créer un nouveau lot

anchoring: [PER-002]
recette: [RS-042-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-042-01 | chiffrer une bague de 10 grammes titrée 750 millièmes au cours figé de 65,000 euros le gramme et au coefficient 0,85 donne 414,38 euros | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour de l'or 18k |
| RS-042-02 | chiffrer un lingot de 100 grammes au cours figé de 65,000 euros le gramme et au coefficient 0,95 donne 6 175,00 euros | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour un lingot |
| RS-042-03 | une référence en argent reprend le cours argent figé du lot, soit 0,800 euro le gramme, et non celui de l'or | test:src/lib/calculations/prix-rachat.test.ts::retourne le cours de l'argent |
| RS-042-04 | la fiche d'un lot figé à 1,644 euro le gramme d'argent affiche ce cours au millième sous « Cours appliqués », et le bon de livraison le reprend | manuel |
| RS-042-05 | ouvrir un lot créé sans aucun cours relevé affiche l'avertissement de prix à zéro et invite à créer un nouveau lot | manuel |
