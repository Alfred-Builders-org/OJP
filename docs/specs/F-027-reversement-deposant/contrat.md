---
id: F-027
---

## Criteres d'acceptation

### AC-001 : La vente d'un article confié produit la quittance du déposant

**Given** un bijou en dépôt-vente dont le prix net déposant est de 420 €, vendu 700 € à un acheteur
**When** le vendeur finalise la vente
**Then** une quittance de dépôt-vente est émise au nom du déposant avec 700 € de ventes, 280 € de commission et 420 € de net déposant, et l'article passe en vendu

anchoring: [R-024, PER-004]
recette: [RS-027-01]

### AC-002 : Un article sans prix net déposant retombe sur une part de 60 %

**Given** un bijou en dépôt-vente vendu 700 € dont la référence de dépôt d'origine ne porte aucun prix net déposant
**When** le vendeur finalise la vente
**Then** la quittance retient 420 € de net déposant, soit 60 % du prix de vente, et 280 € de commission

anchoring: [R-024, PER-004]
recette: [RS-027-02]

### AC-003 : Le net déposant à verser se présente au suivi des règlements

**Given** une quittance de dépôt-vente de 420 € de net déposant, émise et non réglée
**When** le propriétaire ouvre le suivi des règlements du lot de dépôt-vente
**Then** un versement sortant intitulé « Net déposant à verser » et portant le numéro de la quittance lui est proposé pour 420 €

anchoring: [PER-001]
recette: [RS-027-03]

### AC-004 : Une même vente ne peut pas produire deux fois la dette

**Given** un bijou en dépôt-vente déjà couvert par une quittance de dépôt-vente de 420 €
**When** la finalisation de la vente est rejouée sur ce même article
**Then** aucune seconde quittance n'est émise et le montant dû au déposant reste de 420 €

anchoring: [PER-001, PER-004]
recette: [RS-027-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-027-01 | vendre 700 € un bijou en dépôt-vente dont le net déposant est de 420 € émet une quittance à 700 / 280 / 420 et passe l'article en vendu | manuel |
| RS-027-02 | vendre 700 € un bijou en dépôt-vente sans prix net déposant d'origine retient 420 € pour le déposant et 280 € de commission | manuel |
| RS-027-03 | le suivi des règlements du lot de dépôt-vente propose un versement sortant de 420 € au titre de la quittance émise | manuel |
| RS-027-04 | rejouer la finalisation de la vente sur un article déjà quittancé n'émet pas de seconde quittance | manuel |
