---
id: F-051
---

## Criteres d'acceptation

### AC-001 : Un nom tapé sans accent retrouve le client accentué

**Given** une fiche client au nom de « Dupré », enregistrée avec son accent
**When** le vendeur ouvre la palette et frappe les 5 caractères « Dupre », sans accent
**Then** la fiche « Dupré » figure parmi les propositions de la famille clients, et devant les fiches dont seule une partie du nom ressemble à la frappe

anchoring: [R-043, PER-002]
recette: [RS-051-01]

### AC-002 : Une recherche sans session ouverte ne rend aucune donnée

**Given** une session expirée depuis 2 minutes, alors que la palette est encore affichée à l'écran
**When** une recherche est envoyée sur les 4 caractères « Dupo »
**Then** la recherche ne rend rien, aucune fiche client ni aucun numéro de dossier n'apparaît, et le vendeur est ramené à l'écran de connexion

anchoring: [R-030, PER-002]
recette: [RS-051-02]

### AC-003 : Les recherches enchaînées au-delà du seuil sont refusées

**Given** un poste qui a déjà envoyé 20 recherches dans la même minute
**When** une 21e recherche part depuis ce poste avant la fin de la fenêtre
**Then** elle ne rend aucune proposition, et les recherches repartent normalement à la minute suivante

anchoring: [R-042, PER-001]
recette: [RS-051-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-051-01 | frapper « Dupre » sans accent dans la palette retrouve le client enregistré « Dupré » | manuel |
| RS-051-02 | une recherche envoyée sans session ouverte est refusée et ne rend aucune donnée | test:e2e/security.spec.ts::API routes return 401 for unauthenticated requests |
| RS-051-03 | la 21e recherche envoyée dans la même minute depuis un même poste est refusée | manuel |
