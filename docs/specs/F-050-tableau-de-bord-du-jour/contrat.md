---
id: F-050
---

## Criteres d'acceptation

### AC-001 : Une pièce d'identité proche de l'expiration remonte dans les alertes du jour

**Given** un client dont la carte d'identité expire dans 12 jours, alors que le seuil d'alerte des pièces d'identité vaut 30 jours
**When** le propriétaire ouvre le tableau de bord le matin
**Then** la carte Alertes et Délais porte la ligne « CNI bientôt expirée » avec le nom du client et la date d'expiration, et cette ligne conduit à sa fiche

anchoring: [R-022, PER-001]
recette: [RS-050-01]

### AC-002 : Un rachat rétracté ne réclame aucun paiement dans la vue du jour

**Given** deux lots de rachat finalisés sans mode de règlement, l'un mené à son terme et l'autre portant l'issue « rétracté »
**When** le propriétaire consulte les paiements dus du tableau de bord
**Then** seul le lot mené à son terme est réclamé, et le lot rétracté n'apparaît nulle part comme somme à verser

anchoring: [R-014, PER-001]
recette: [RS-050-02, RS-050-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-050-01 | ouvrir le tableau de bord avec un client dont la CNI expire dans 12 jours et un seuil d'alerte de 30 jours affiche la ligne « CNI bientôt expirée » | manuel |
| RS-050-02 | un lot de rachat finalisé dont l'issue est « rétracté » est écarté des paiements dus | test:src/components/dashboard/dashboard-helpers.test.ts::écarte une rétractation |
| RS-050-03 | un lot de rachat finalisé sans issue particulière reste réclamé dans les paiements dus | test:src/components/dashboard/dashboard-helpers.test.ts::retient une opération menée à son terme |
