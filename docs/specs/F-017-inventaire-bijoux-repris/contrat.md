---
id: F-017
---

## Criteres d'acceptation

### AC-001 : Un bijou racheté entre à l'inventaire avec ce que le chiffrage a mesuré

**Given** un rachat finalisé pour Mme Martin portant une référence « Bague jonc or 18k », métal Or, poids net 12,40 g, prix d'achat 420,00 EUR et prix de revente estimé 690,00 EUR
**When** le vendeur ouvre l'article de stock créé par cette finalisation
**Then** l'article porte la désignation, le métal, la qualité, le poids net 12,40 g, le prix d'achat 420,00 EUR, le prix de revente 690,00 EUR, et son origine indique Mme Martin et un rachat

anchoring: [PER-002]
recette: [RS-017-01]

### AC-002 : Un bijou repris se range du côté de la fonte tant qu'on ne l'a pas remis en stock

**Given** un rachat finalisé le 14 mars 2026 portant une référence « Bague jonc or 18k » à laquelle le vendeur avait choisi la destination Stock boutique
**When** le vendeur ouvre la liste des bijoux puis revient sur le lot
**Then** l'article n'apparaît pas dans la liste des bijoux car il est destiné à la fonte, et le lot affiche toujours la carte d'attention « Destination des références » avec le texte « Sélectionnez la destination de chaque référence avant de finaliser le lot. »

anchoring: [R-032, PER-002]
recette: [RS-017-02, RS-017-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-017-01 | finaliser un rachat portant une bague jonc or 18k de 12,40 g achetée 420,00 EUR et vérifier que l'article de stock reprend désignation, métal, qualité, poids, prix et origine cliente | manuel |
| RS-017-02 | vérifier que ce même article, destiné à la fonte, n'est pas listé parmi les bijoux de boutique, et qu'il y apparaît après remise en stock depuis sa fiche | manuel |
| RS-017-03 | ouvrir un lot non soldé et vérifier que la carte d'attention « Destination des références » est affichée avec son texte de consigne | manuel |
