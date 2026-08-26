---
id: F-029
---

## Criteres d'acceptation

### AC-001 : Un dépôt signé ne porte aucune date de fin de contrat

**Given** un contrat de dépôt-vente signé le 12 janvier 2025, dont la clause de durée fixe 1 an et un préavis de 7 jours calendaires
**When** le propriétaire consulte ce dépôt le 20 janvier 2026, soit après le terme
**Then** aucune date de fin de contrat n'est portée sur le dépôt et rien ne le signale comme dépassé

anchoring: [R-024, PER-001]
recette: [RS-029-01]

### AC-002 : La relance des dépôts invendus ne part pas

**Given** 2 contrats de dépôt-vente arrivés à leur terme depuis plus de 30 jours et le modèle de courrier « Rappel dépôt-vente invendu » actif
**When** la relance quotidienne des dépôts invendus est déclenchée à la main
**Then** aucun courrier « Rappel : Articles dépôt-vente invendus » ne part et aucune alerte de dépôt-vente expiré n'apparaît au comptoir

anchoring: [PER-001, PER-004]
recette: [RS-029-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-029-01 | consulter le 20 janvier 2026 un dépôt-vente signé le 12 janvier 2025 ne montre aucune date de fin de contrat ni signalement de dépassement | manuel |
| RS-029-02 | déclencher à la main la relance des dépôts invendus sur 2 dépôts dépassés n'envoie aucun courrier et ne crée aucune alerte | manuel |
