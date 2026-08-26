---
id: F-033
---

## Criteres d'acceptation

### AC-001 : L'écart de valeur se recalcule sur le cours figé à l'envoi

**Given** une ligne du bon de livraison BDL-2026-0001 déclarée 100 g au titre 750, valorisée 8 502,00 euros au cours de 85,02 euros le gramme
**When** le propriétaire saisit le poids retenu par le fondeur, 98,40 g, et le titre retenu, 742
**Then** la colonne Écart valeur affiche -225,27 euros, et la ligne est signalée comme portant à la fois un écart de titre et un écart de poids

anchoring: [R-019, PER-005]
recette: [RS-033-01]

### AC-002 : Le poids annoncé d'un bon est toujours la somme de ses lignes

**Given** un bon de livraison portant 3 articles déclarés à 100 g, 50 g et 25 g
**When** le propriétaire ouvre ce bon de livraison
**Then** le bon annonce un poids total de 175,00 g, somme de ses trois lignes, qu'aucune saisie ne fixe

anchoring: [R-044, PER-001]
recette: [RS-033-02]

### AC-003 : Un bon traité ne se retouche plus

**Given** le bon de livraison BDL-2026-0001 dont les résultats du fondeur ont été validés et qui porte le statut « Traité »
**When** le propriétaire rouvre les résultats de ce bon
**Then** les 7 colonnes du relevé restent affichées avec les valeurs enregistrées, aucune n'est modifiable et seule la fermeture est proposée

anchoring: [PER-001, PER-005]
recette: [RS-033-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-033-01 | saisir un poids retenu de 98,40 g et un titre retenu de 742 sur une ligne déclarée 100 g au titre 750 et vérifier l'écart de -225,27 euros | manuel |
| RS-033-02 | ouvrir un bon de livraison de 3 articles déclarés à 100 g, 50 g et 25 g et vérifier le poids total de 175,00 g | manuel |
| RS-033-03 | rouvrir un bon de livraison au statut Traité et vérifier que le relevé est consultable mais non modifiable | manuel |
