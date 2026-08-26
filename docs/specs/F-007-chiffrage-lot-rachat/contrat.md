---
id: F-007
---

## Criteres d'acceptation

### AC-001 : Le prix d'un bijou suit le titre réel du métal

**Given** un lot de rachat en brouillon dont le cours de l'or est figé à 65,000 euros le gramme et le coefficient de rachat à 0,85
**When** le vendeur ajoute une référence « Bracelet or 18k », qualité 750, poids net 10 g, quantité 1
**Then** le prix de rachat proposé est 414,38 euros, soit le cours ramené au titre 750 puis au coefficient du comptoir

anchoring: [R-001, PER-002]
recette: [RS-007-01]

### AC-002 : Le prix d'un produit d'investissement ignore le titre

**Given** un lot de rachat en brouillon dont le cours de l'or est figé à 65,000 euros le gramme et le coefficient d'achat à 0,95
**When** le vendeur choisit dans le catalogue un lingot de 100 g et saisit la quantité 1
**Then** le prix de rachat proposé est 6175,00 euros, aucun facteur de titre n'étant appliqué à un produit en or fin

anchoring: [R-002, PER-002]
recette: [RS-007-02]

### AC-003 : Le cours figé est employé et conservé au millième d'euro

**Given** un lot de rachat en brouillon dont le cours de l'argent est figé à 1,644 euro le gramme et le coefficient de rachat à 0,85
**When** le vendeur ajoute une référence en argent, qualité 800, poids net 100 g, quantité 1
**Then** le prix proposé est 111,79 euros et la référence garde le cours 1,644 qui l'a produit, non un cours ramené à 1,64

anchoring: [R-019, PER-002]
recette: [RS-007-03]

### AC-004 : Le total du lot se refait tout seul à chaque changement de ligne

**Given** un lot de rachat en brouillon portant 2 références chiffrées 414,38 euros et 111,79 euros, pour un total de 526,17 euros
**When** le vendeur supprime la référence à 111,79 euros
**Then** le total du lot affiche 414,38 euros sans aucune saisie du vendeur

anchoring: [R-044, PER-002]
recette: [RS-007-04]

### AC-005 : Une référence de bijou incomplète n'est pas enregistrée

**Given** une référence « Bracelet or 18k » de qualité 750 dont le poids net et la quantité sont laissés vides
**When** le vendeur enregistre cette référence sur un lot de rachat en brouillon
**Then** l'enregistrement est refusé et l'écran affiche « Désignation, métal, qualité, poids brut, poids net et quantité sont requis. »

anchoring: [R-001, PER-002]
recette: [RS-007-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-007-01 | chiffrer un bracelet or 750 de 10 g net au cours figé 65,000 euros et au coefficient 0,85 donne 414,38 euros | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour de l'or 18k |
| RS-007-02 | chiffrer un lingot de 100 g au cours figé 65,000 euros et au coefficient 0,95 donne 6175,00 euros sans facteur de titre | test:src/lib/calculations/prix-rachat.test.ts::calcule correctement pour un lingot |
| RS-007-03 | chiffrer un bijou argent 800 de 100 g net au cours figé 1,644 euro donne 111,79 euros et la référence conserve le cours 1,644 | manuel |
| RS-007-04 | supprimer une référence à 111,79 euros sur un lot totalisant 526,17 euros ramène le total du lot à 414,38 euros sans saisie | manuel |
| RS-007-05 | enregistrer une référence bijou sans poids net ni quantité est refusé avec le message listant les champs requis | manuel |
