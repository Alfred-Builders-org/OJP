---
id: F-040
---

## Criteres d'acceptation

### AC-001 : Un seul relevé automatique par journée, quel que soit le nombre d'ouvertures

**Given** le 12 mars 2026 à 8 h 55, aucun cours n'ayant encore été relevé ce jour-là, le vendeur puis le propriétaire ouvrent l'application à une minute d'intervalle
**When** le tableau de bord se charge pour l'un puis pour l'autre
**Then** un seul relevé part, les deux voient exactement les mêmes cours, et aucun autre relevé automatique n'a lieu jusqu'au lendemain

anchoring: [R-018, PER-002]
recette: [RS-040-01]

### AC-002 : Le vendeur lit les cours du jour, seul le propriétaire peut les modifier

**Given** le cours de l'or relevé ce jour vaut 113,357 euros le gramme et la personne connectée est un vendeur
**When** le vendeur consulte les cours du jour depuis son poste de comptoir
**Then** il lit bien 113,357 euros le gramme, et l'écran des prix où se modifient les cours lui reste fermé

anchoring: [R-020, PER-001, PER-002]
recette: [RS-040-02]

### AC-003 : Les cours relevés sont retenus au millième d'euro

**Given** la source annonce l'or à 113,3567 euros le gramme, l'argent à 1,6442 euro le gramme et le platine à 30,8118 euros le gramme
**When** le relevé du jour s'enregistre
**Then** les cours retenus sont 113,357, 1,644 et 30,812 euros le gramme, avec trois décimales et non deux

anchoring: [R-019, PER-001]
recette: [RS-040-03]

### AC-004 : Un métal manquant n'écrit aucun cours et consomme quand même la journée

**Given** les cours de la veille sont l'or à 113,357 euros le gramme et l'argent à 1,644 euro le gramme, et ce matin la source répond pour l'or et le platine mais pas pour l'argent
**When** le relevé du jour part à la première ouverture de l'application
**Then** aucun des trois cours ne change, ceux de la veille restent en place, et aucune nouvelle tentative automatique n'a lieu avant le lendemain

anchoring: [R-018, PER-002]
recette: [RS-040-04]

### AC-005 : Un service injoignable au relevé manuel laisse les cours en place

**Given** le propriétaire ouvre Paramètres puis l'onglet Prix, l'or y étant affiché à 113,357 euros le gramme, et le service de cours ne répond pas
**When** il actionne « Actualiser au cours du marché »
**Then** l'écran affiche « Le service de cours est injoignable. Réessayez dans un instant. » et le cours de l'or reste à 113,357 euros le gramme

anchoring: [R-018, PER-001]
recette: [RS-040-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-040-01 | ouvrir l'application le 12 mars 2026 à 8 h 55 avec un vendeur puis à 8 h 56 avec le propriétaire ne déclenche qu'un seul relevé et affiche les mêmes cours aux deux | manuel |
| RS-040-02 | un vendeur lit l'or à 113,357 euros le gramme mais n'atteint pas l'écran des prix | manuel |
| RS-040-03 | une source annoncant 113,3567 et 1,6442 euros le gramme donne des cours retenus à 113,357 et 1,644 | manuel |
| RS-040-04 | une source qui ne répond que pour l'or et le platine laisse les trois cours de la veille inchangés et ne relance pas de tentative le jour même | manuel |
| RS-040-05 | actionner « Actualiser au cours du marché » avec un service injoignable affiche le message d'indisponibilité et laisse l'or à 113,357 euros le gramme | manuel |
