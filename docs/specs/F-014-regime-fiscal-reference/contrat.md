---
id: F-014
---

## Criteres d'acceptation

### AC-001 : La taxe sur les métaux précieux s'applique sans condition ni seuil

**Given** un client qui apporte de l'or d'investissement repris 10 000 euros et n'apporte aucun justificatif d'acquisition
**When** le vendeur enregistre la référence sur le lot de rachat
**Then** la taxe retenue est celle sur les métaux précieux et vaut 1 150 euros, soit 11,5 % du prix de rachat

anchoring: [R-003, PER-001]
recette: [RS-014-01]

### AC-002 : Vingt-deux ans de détention éteignent la plus-value

**Given** un lingot acquis 4 000 euros le 3 février 1998, repris 9 000 euros, dont le client justifie l'acquisition
**When** le vendeur enregistre la référence sur le lot de rachat
**Then** la taxe sur la plus-value est nulle, et c'est ce régime qui est retenu face aux 1 035 euros du régime des métaux précieux

anchoring: [R-005, R-008, PER-004]
recette: [RS-014-02]

### AC-003 : Un bijou cédé sous 5 000 euros n'est pas taxé au forfait

**Given** un bijou repris 4 800 euros par le comptoir, sans justificatif d'acquisition
**When** le vendeur enregistre la référence sur le lot de rachat
**Then** la ligne « TFOP (6,5%) » affiche « Exonéré (≤ 5 000 €) » et la taxe enregistrée sur la référence est nulle

anchoring: [R-006, PER-004]
recette: [RS-014-03]

### AC-004 : Le régime retenu est celui qui coûte le moins au client

**Given** de l'or d'investissement repris 10 000 euros, acquis 8 000 euros le 12 janvier 2025, avec facture et scellés
**When** le vendeur enregistre la référence sur le lot de rachat
**Then** la ligne « TPV (plus-value) » est celle qui est retenue et signalée par une coche, à 724 euros contre 1 150 euros au titre des métaux précieux

anchoring: [R-008, R-005, PER-004]
recette: [RS-014-04]

### AC-005 : Un bijou se compare à la taxe forfaitaire et non à celle des métaux

**Given** un bijou repris 12 000 euros par le comptoir, dont le client ne justifie pas l'acquisition
**When** le vendeur enregistre la référence sur le lot de rachat
**Then** la taxe retenue est la taxe forfaitaire sur les objets précieux, 780 euros, et non celle sur les métaux précieux qui aurait valu 1 380 euros

anchoring: [R-009, R-006, PER-004]
recette: [RS-014-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-014-01 | une référence d'or d'investissement reprise 10 000 euros porte une taxe métaux précieux de 1 150 euros | test:src/lib/calculations/taxes.test.ts::calcule 11.5% sur un montant standard |
| RS-014-02 | un lingot acquis le 3 février 1998 et repris 9 000 euros sort exonéré au titre de la plus-value | test:src/lib/calculations/taxes.test.ts::exonération totale après 22 ans de détention |
| RS-014-03 | un bijou repris 4 800 euros affiche « Exonéré (≤ 5 000 €) » et une taxe nulle | test:src/lib/calculations/taxes.test.ts::retourne 0 pour un montant ≤ 5000 € |
| RS-014-04 | une plus-value de 724 euros l'emporte sur une taxe métaux précieux de 1 150 euros | test:src/lib/calculations/taxes.test.ts::choisit TPV quand c'est moins cher que TMP |
| RS-014-05 | un bijou repris 12 000 euros est comparé à la taxe forfaitaire de 780 euros et non aux métaux précieux | test:src/lib/calculations/taxes.test.ts::choisit TFOP quand c'est moins cher ou égal |
