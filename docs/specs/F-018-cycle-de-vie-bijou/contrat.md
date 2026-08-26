---
id: F-018
---

## Criteres d'acceptation

### AC-001 : La fiche situe l'article sur un parcours en trois étapes

**Given** un bijou repris entré à l'inventaire le 14 mars 2026 avec l'état « à fondre »
**When** le vendeur le remet en stock depuis sa fiche, puis l'envoie en réparation
**Then** la fiche montre les trois étapes « Entrée », « En stock » et « Sortie », et l'article se tient sur « En stock » aussi bien après la remise en stock qu'une fois en réparation

anchoring: [PER-002]
recette: [RS-018-01, RS-018-02]

### AC-002 : Un article rendu à son déposant est une sortie signalée en attention

**Given** un article confié en dépôt-vente puis rendu à son déposant le 2 avril 2026 sans avoir été vendu
**When** le vendeur ouvre la fiche de cet article
**Then** l'étape « Sortie » est atteinte, mais elle est marquée en ambre comme une attention requise et non comme un succès

anchoring: [R-032, PER-002]
recette: [RS-018-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-018-01 | remettre en stock un article à fondre depuis sa fiche et vérifier qu'il se place sur l'étape « En stock », puis l'envoyer en fonderie et vérifier qu'il quitte cette étape | manuel |
| RS-018-02 | envoyer en réparation un article en stock et vérifier qu'il reste sur l'étape « En stock » | manuel |
| RS-018-03 | ouvrir la fiche d'un article rendu à son déposant et vérifier que l'étape « Sortie » est signalée en ambre et non en vert | manuel |
