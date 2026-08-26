---
id: F-011
---

## Criteres d'acceptation

### AC-001 : Une reprise directe de bijoux ouvre un délai de 48 heures

**Given** un dossier finalisé le 3 mars 2026 à 10h00 dont l'affaire porte un bracelet de 22,60 g repris en direct
**When** le vendeur ouvre l'affaire
**Then** la carte « Délai de rétractation » annonce un début au 3 mars 2026 à 10h00, une fin au 5 mars 2026 à 10h00, et le bracelet est en délai de rétractation

anchoring: [R-010, PER-002, PER-004]
recette: [RS-011-01]

### AC-002 : Le décompte affiche le temps restant puis l'expiration

**Given** une affaire dont le délai de rétractation court jusqu'au 5 mars 2026 à 10h00
**When** le vendeur consulte l'affaire le 4 mars 2026 à 10h30, puis le 5 mars 2026 à 14h00
**Then** la carte affiche d'abord « 23h 30m restantes », puis annonce que le délai est expiré et que l'affaire peut être finalisée

anchoring: [R-010, PER-002]
recette: [RS-011-02]

### AC-003 : L'échéance passée ne ferme rien d'elle-même

**Given** une affaire dont le délai de rétractation s'est achevé le 5 mars 2026 à 10h00 sans nouvelle du client
**When** le vendeur ouvre sa vue du jour le 5 mars 2026 à 14h00
**Then** l'affaire quitte « Délai de rétractation en cours » pour « Délai de rétractation écoulé · à valider » et attend un geste du comptoir pour se clore

anchoring: [R-010, PER-002]
recette: [RS-011-03]

### AC-004 : Un délai réglé à 24 heures ne s'applique qu'à une partie du parcours

**Given** le réglage « Délai de rétractation » porté à 24 heures, un dossier étant finalisé le 3 mars 2026 à 10h00
**When** le vendeur ouvre l'affaire et compare l'échéance inscrite aux gestes qu'on lui propose
**Then** l'échéance inscrite sur l'affaire reste au 5 mars 2026 à 10h00 alors que les gestes proposés raisonnent sur une fin au 4 mars 2026 à 10h00

anchoring: [R-024, PER-004]
recette: [RS-011-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-011-01 | finaliser le 3 mars 2026 à 10h00 un dossier portant un bracelet de 22,60 g repris en direct ouvre un délai jusqu'au 5 mars 2026 à 10h00 | manuel |
| RS-011-02 | le décompte affiche « 23h 30m restantes » le 4 mars 2026 à 10h30 puis annonce l'expiration le 5 mars 2026 à 14h00 | manuel |
| RS-011-03 | une affaire dont le délai s'est achevé le 5 mars 2026 à 10h00 bascule sous « Délai de rétractation écoulé · à valider » sans se clore seule | manuel |
| RS-011-04 | porter « Délai de rétractation » à 24 heures fait diverger l'échéance inscrite et les gestes proposés sur l'affaire | manuel |
