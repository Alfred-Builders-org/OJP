---
id: F-016
---

## Criteres d'acceptation

### AC-001 : Seules les taxes des rachats finalisés entrent dans l'assiette

**Given** un lot finalisé le 4 juin 2026 portant une taxe métaux précieux de 1 150 euros, et un lot encore en brouillon portant une taxe forfaitaire de 780 euros
**When** le propriétaire ouvre l'écran des impôts
**Then** seule la ligne du lot finalisé est listée, avec sa date, sa référence, son client, son régime, son montant brut et sa taxe

anchoring: [R-003, R-006, PER-001]
recette: [RS-016-01]

### AC-002 : Les taxes des ventes rejoignent celles des rachats au même tableau

**Given** une facture de vente émise le 12 mai 2026 portant 240 euros de taxe sur la valeur ajoutée sur marge
**When** le propriétaire ouvre l'écran des impôts
**Then** la ligne de la facture figure au tableau sous le régime TVA, à côté des taxes de rachat, et renvoie à la vente d'origine

anchoring: [R-007, PER-001]
recette: [RS-016-02]

### AC-003 : Un filtre de régime sans correspondance laisse le tableau vide et le dit

**Given** un écran des impôts ne comportant que des taxes de régime métaux précieux et TVA
**When** le propriétaire ne coche que le filtre « TPV (Plus-Value) »
**Then** aucune ligne ne reste affichée et le tableau annonce « Aucune taxe trouvée. »

anchoring: [PER-001]
recette: [RS-016-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-016-01 | l'écran des impôts liste le lot finalisé le 4 juin 2026 et sa taxe de 1 150 euros, et ignore le lot en brouillon | manuel |
| RS-016-02 | une facture de vente du 12 mai 2026 portant 240 euros de TVA apparaît au tableau des impôts | manuel |
| RS-016-03 | cocher le seul filtre « TPV (Plus-Value) » sans ligne correspondante affiche « Aucune taxe trouvée. » | manuel |
