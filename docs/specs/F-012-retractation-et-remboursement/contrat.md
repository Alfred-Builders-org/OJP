---
id: F-012
---

## Criteres d'acceptation

### AC-001 : La rétractation ferme l'affaire sur l'issue « rétracté »

**Given** une affaire dont les 2 bijoux sont en délai de rétractation depuis le 3 mars 2026 à 10h00
**When** le vendeur enregistre la rétractation du client
**Then** les 2 bijoux passent à l'état rétracté et l'affaire se ferme avec l'issue « rétracté »

anchoring: [R-010, PER-004]
recette: [RS-012-01]

### AC-002 : La somme déjà versée revient par un mouvement de sens opposé adossé à un reçu

**Given** l'affaire RAC-2026-0010, en délai de rétractation, sur laquelle le client a été payé 1 250,00 EUR en espèces le 3 mars 2026
**When** le vendeur enregistre la rétractation du client
**Then** un reçu de remboursement numéroté est émis, un mouvement de 1 250,00 EUR en espèces est inscrit en sens inverse avec la note « Remboursement suite à rétractation du client (contrat RAC-2026-0010) », le contrat de rachat passe annulé et le total réglé de l'affaire retombe à 0,00 EUR

anchoring: [R-015, PER-004]
recette: [RS-012-02]

### AC-003 : Une rétractation sans versement préalable ne produit aucun reçu

**Given** une affaire en délai de rétractation dont le total réglé vaut 0,00 EUR
**When** le vendeur enregistre la rétractation du client
**Then** l'affaire se ferme sur l'issue « rétracté » sans qu'aucun reçu de remboursement ni mouvement d'argent ne soit produit

anchoring: [R-015, PER-002]
recette: [RS-012-03]

### AC-004 : Un remboursement qui ne s'inscrit pas n'arrête pas la rétractation

**Given** l'affaire RAC-2026-0010 sur laquelle le client a été payé 1 250,00 EUR et dont l'inscription du remboursement échoue
**When** le vendeur enregistre la rétractation du client
**Then** les bijoux passent à l'état rétracté et l'affaire se ferme sur l'issue « rétracté », sans reçu de remboursement et sans message avertissant le comptoir que la somme rendue n'a pas été portée en caisse

anchoring: [R-015, PER-002]
recette: [RS-012-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-012-01 | rétracter une affaire portant 2 bijoux en délai depuis le 3 mars 2026 la ferme sur l'issue « rétracté » | manuel |
| RS-012-02 | rétracter RAC-2026-0010 déjà payée 1 250,00 EUR en espèces émet un reçu de remboursement et ramène le total réglé à 0,00 EUR | manuel |
| RS-012-03 | rétracter une affaire dont le total réglé vaut 0,00 EUR ne produit ni reçu ni mouvement d'argent | manuel |
| RS-012-04 | rétracter RAC-2026-0010 quand l'inscription du remboursement échoue ferme quand même l'affaire, sans avertir le comptoir | manuel |
