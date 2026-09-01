---
id: F-010
---

## Criteres d'acceptation

### AC-001 : L'acceptation ouvre la suite propre à chaque objet repris

**Given** une opération en cours portant une chevalière et un lingotin de 20 g, tous deux chiffrés au devis DEV-2026-0007 et en attente de réponse
**When** le vendeur enregistre l'acceptation du client depuis « Devis DEV-2026-0007 | En attente de réponse client »
**Then** la chevalière entre en délai de rétractation avec son contrat de rachat, le lingotin passe en attente de paiement avec sa quittance, et le devis est marqué accepté

anchoring: [R-010, PER-002]
recette: [RS-010-01]

### AC-002 : Le refus ferme la ligne et l'opération se clôt sur l'issue « refusé »

**Given** une opération en cours dont les 3 objets attendent une réponse sur le devis DEV-2026-0007
**When** le vendeur confirme le refus dans la fenêtre « Refuser le devis »
**Then** les 3 objets passent en devis refusé, le devis est marqué refusé, et l'opération se ferme avec l'issue « refusé » sans qu'aucune autre réponse ne puisse y être enregistrée

anchoring: [R-010, PER-004]
recette: [RS-010-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-010-01 | accepter le devis DEV-2026-0007 met la chevalière en rétractation avec contrat et le lingotin de 20 g en attente de paiement avec quittance | manuel |
| RS-010-02 | refuser le devis DEV-2026-0007 sur ses 3 objets ferme l'opération avec l'issue « refusé » et interdit toute réponse ultérieure | manuel |
