---
id: F-026
---

## Criteres d'acceptation

### AC-001 : La commission réglée par le propriétaire fixe le prix affiché public

**Given** un comptoir dont la commission de dépôt-vente est réglée à 40 % et un bijou dont le prix net déposant est fixé à 500 €
**When** le vendeur saisit ce bijou dans un lot de dépôt-vente
**Then** le champ Commission (%) est pré-rempli à 40 et le prix de revente proposé est de 700 €

anchoring: [R-024, PER-002]
recette: [RS-026-01]

### AC-002 : Les articles n'entrent au dépôt-vente qu'à la signature du contrat

**Given** un lot de dépôt-vente de 3 articles finalisé, dont le contrat de dépôt-vente et les 3 confiés d'achat ont été émis et envoyés au déposant
**When** le vendeur cherche ces 3 articles au compte du dépôt-vente avant que le contrat ne soit signé
**Then** aucun des 3 n'y figure, et ils n'y apparaissent qu'une fois l'action de signature du contrat de dépôt-vente exécutée

anchoring: [PER-002, PER-004]
recette: [RS-026-02, RS-026-03]

### AC-003 : Une pièce qui ne s'émet pas annule toute la finalisation

**Given** un lot de dépôt-vente de 2 articles dont l'une des pièces ne peut pas être produite
**When** le vendeur finalise le lot
**Then** la finalisation est refusée avec le motif d'échec de génération, et le lot reste ouvert au lieu de passer en cours

anchoring: [PER-002]
recette: [RS-026-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-026-01 | saisir un bijou à 500 € de net déposant dans un lot de dépôt-vente propose 40 % de commission et 700 € de prix de revente | manuel |
| RS-026-02 | finaliser un lot de dépôt-vente de 3 articles émet un contrat de dépôt-vente, 3 confiés d'achat, passe le lot en cours et envoie le contrat au déposant | manuel |
| RS-026-03 | les articles du lot finalisé sont absents du compte du dépôt-vente avant signature du contrat et y figurent après | manuel |
| RS-026-04 | finaliser un lot de dépôt-vente dont une pièce ne peut pas être produite laisse le lot ouvert et affiche le motif d'échec | manuel |
