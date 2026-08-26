---
id: F-031
---

## Criteres d'acceptation

### AC-001 : Une quantité se partage entre le stock et une fonderie en une seule validation

**Given** une ligne de vente de 5 pièces d'or d'investissement dont le panneau de répartition annonce « Stock disponible : 2 »
**When** le propriétaire affecte 2 pièces au stock, 3 pièces à la fonderie CPoR Devises, puis valide le dispatch
**Then** les 2 pièces servies sont marquées servies sur stock et la quantité en réserve tombe de 2 à 0, tandis que les 3 pièces restantes deviennent une commande adressée à CPoR Devises

anchoring: [R-021, PER-001, PER-005]
recette: [RS-031-01]

### AC-002 : Une répartition incomplète ne peut pas être confirmée

**Given** une ligne de 5 pièces sur laquelle seules 3 pièces ont été affectées à une destination
**When** le propriétaire tente de confirmer cette répartition de 3 pièces
**Then** le compteur affiche « Total dispatché 3 / 5 » et la confirmation reste indisponible tant que le compte n'y est pas

anchoring: [R-021, PER-001]
recette: [RS-031-02]

### AC-003 : Un envoi en fonte ne part qu'avec un destinataire et au moins un article

**Given** la liste des bijoux repris ouverte sur 12 articles disponibles, sans fonderie choisie et sans article coché
**When** le propriétaire cherche à créer le bon de livraison
**Then** la création reste indisponible, et elle ne redevient possible qu'une fois une fonderie choisie et au moins 1 article coché

anchoring: [PER-001, PER-005]
recette: [RS-031-03, RS-031-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-031-01 | répartir une ligne de 5 pièces en 2 servies sur le stock et 3 commandées chez CPoR Devises, et vérifier que la réserve tombe à 0 | manuel |
| RS-031-02 | affecter 3 pièces sur une ligne de 5 et constater « Total dispatché 3 / 5 » avec confirmation indisponible | manuel |
| RS-031-03 | ouvrir l'envoi en fonte sans fonderie ni article coché et constater que la création reste indisponible | manuel |
| RS-031-04 | envoyer 3 bijoux en or titre 750 chez Gold by Gold et vérifier que chaque article est valorisé au cours du jour corrigé de son titre | manuel |
