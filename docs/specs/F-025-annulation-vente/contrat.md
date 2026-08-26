---
id: F-025
---

## Criteres d'acceptation

### AC-001 : Annuler une vente en cours la clôt et l'affiche annulée

**Given** une vente en cours portant 2 articles, sur laquelle le vendeur ouvre le dialogue « Annuler la vente »
**When** il confirme par « Oui, annuler »
**Then** la vente est close, son statut affiche « Annulé » en rouge, et elle reste consultable au dossier du client

anchoring: [R-011, PER-002]
recette: [RS-025-01]

### AC-002 : Chaque article revient à l'origine d'où il venait

**Given** une vente en cours portant 2 bijoux, l'un repris au comptoir et l'autre confié par un déposant
**When** le vendeur annule cette vente
**Then** le bijou repris redevient disponible en stock et le bijou confié redevient un article en dépôt-vente, chacun de nouveau proposable à la vente

anchoring: [R-016, PER-002]
recette: [RS-025-02]

### AC-003 : Retirer une seule ligne restitue l'article sans annuler la vente

**Given** une vente en cours de 3 lignes, dont l'une porte un bijou du stock à 515,00 €
**When** le vendeur retire cette ligne de la vente
**Then** le bijou redevient disponible en stock et la vente reste en cours avec ses 2 autres lignes

anchoring: [R-011, PER-002]
recette: [RS-025-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-025-01 | annuler une vente en cours de 2 articles la clôt avec le statut Annulé et la laisse consultable | manuel |
| RS-025-02 | annuler une vente portant un bijou du comptoir et un bijou de déposant rend chacun à son origine | manuel |
| RS-025-03 | retirer la ligne de 515,00 € d'une vente de 3 lignes remet le bijou en stock sans annuler la vente | manuel |
