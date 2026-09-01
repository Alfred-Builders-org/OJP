---
id: F-028
---

## Criteres d'acceptation

### AC-001 : Restituer un article le rend au déposant sans frais et annule son reçu

**Given** un dépôt de 3 articles en cours, dans un comptoir dont le forfait de nettoyage est réglé à 20 € et les frais de garde à 10 € par mois
**When** le vendeur restitue l'un des 3 articles au déposant
**Then** cet article est marqué restitué, il sort du compte du dépôt-vente, son confié d'achat est annulé, et aucun frais n'est facturé ni porté sur une pièce

anchoring: [R-024, PER-004, PER-002]
recette: [RS-028-01]

### AC-002 : Un dépôt entièrement rendu se referme et n'offre plus rien à restituer

**Given** un dépôt de 3 articles dont les 3 ont été restitués au déposant
**When** le vendeur rouvre la restitution de ce dépôt
**Then** l'écran annonce que tous les articles ont été restitués, les 3 figurent parmi les articles déjà rendus, et le dépôt est clôturé

anchoring: [PER-002]
recette: [RS-028-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-028-01 | restituer 1 article sur 3 d'un dépôt le marque restitué, le sort du dépôt-vente, annule son confié d'achat et ne facture aucun frais | manuel |
| RS-028-02 | rouvrir la restitution d'un dépôt dont les 3 articles sont rendus annonce que tout a été restitué et le dépôt est clôturé | manuel |
