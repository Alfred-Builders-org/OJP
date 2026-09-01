---
id: F-048
---

## Criteres d'acceptation

### AC-001 : Le coefficient de rachat s'applique au prix d'un bijou, au titre réel du métal

**Given** un lot dont le cours de l'or figé vaut 65 € le gramme et un coefficient de rachat réglé à 0,85
**When** le vendeur chiffre un bijou en or 18 carats, soit 750 millièmes, pesé à 10 g
**Then** le prix de rachat annoncé vaut 414,38 €, arrondi au centime

anchoring: [R-001, PER-001]
recette: [RS-048-01]

### AC-002 : Le coefficient s'applique sans facteur de titre sur un produit d'investissement

**Given** un lot dont le cours de l'or figé vaut 65 € le gramme et un coefficient d'achat réglé à 0,95
**When** le vendeur chiffre un lingot de 100 g repris au catalogue
**Then** le prix de rachat annoncé vaut 6 175,00 €, sans qu'aucun titre en millièmes n'intervienne

anchoring: [R-002, PER-001]
recette: [RS-048-02]

### AC-003 : Les deux coefficients se règlent aux paramètres et se figent sur le lot

**Given** un coefficient de rachat à 0,85 et un coefficient de vente à 1,05 le jour où un lot est chiffré
**When** le propriétaire porte le lendemain le coefficient de rachat à 0,90, puis rouvre le lot de la veille et en ouvre un nouveau
**Then** le lot de la veille garde son prix calculé à 0,85 et le lot du jour est chiffré à 0,90

anchoring: [R-024, PER-001]
recette: [RS-048-03]

### AC-004 : Un coefficient hors bornes est refusé et rien n'est enregistré

**Given** l'écran des prix et coefficients, coefficient de rachat à 0,85 et coefficient de vente à 1,05
**When** le propriétaire saisit 2,5 en coefficient de rachat et enregistre
**Then** l'écran affiche « Le coefficient de rachat doit être entre 0 et 2. », et les deux coefficients restent à 0,85 et 1,05

anchoring: [R-024, PER-001]
recette: [RS-048-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-048-01 | chiffrer un bijou or 750 millièmes de 10 g au cours de 65 EUR le gramme avec un coefficient de 0,85 donne 414,38 EUR | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour de l'or 18k |
| RS-048-02 | chiffrer un lingot de 100 g au cours de 65 EUR le gramme avec un coefficient de 0,95 donne 6175 EUR sans facteur de titre | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour un lingot |
| RS-048-03 | porter le coefficient de rachat de 0,85 à 0,90 puis vérifier qu'un lot de la veille garde son prix et qu'un lot neuf applique 0,90 | manuel |
| RS-048-04 | saisir 2,5 en coefficient de rachat et constater le refus avec le message de bornes, coefficients inchangés | manuel |
