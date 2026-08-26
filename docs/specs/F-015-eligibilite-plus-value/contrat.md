---
id: F-015
---

## Criteres d'acceptation

### AC-001 : Les quatre justificatifs réunis ouvrent le régime de la plus-value

**Given** une référence dont le vendeur coche la facture au nom du client et le justificatif d'achat, et saisit une acquisition du 14 mars 2019 pour 3 200 euros
**When** le vendeur consulte le comparatif fiscal de la référence
**Then** la ligne « TPV (plus-value) » apparaît avec son montant, aux côtés du régime forfaitaire

anchoring: [R-004, PER-002]
recette: [RS-015-01]

### AC-002 : Sans facture au nom du client, la plus-value reste fermée

**Given** une référence dont l'acquisition est datée du 14 mars 2019 pour 3 200 euros, le justificatif d'achat coché, mais la facture au nom du client non cochée
**When** le vendeur consulte le comparatif fiscal de la référence
**Then** la ligne de plus-value affiche « Non éligible » et seul le régime forfaitaire est proposé

anchoring: [R-004, PER-004]
recette: [RS-015-02]

### AC-003 : Une date d'acquisition manquante suffit à fermer la plus-value

**Given** une référence dont la facture et le justificatif d'achat sont cochés et le prix d'acquisition saisi à 3 200 euros, mais dont la date d'acquisition est laissée vide
**When** le vendeur consulte le comparatif fiscal de la référence
**Then** la ligne de plus-value affiche « Non éligible », les quatre conditions étant cumulatives

anchoring: [R-004, PER-004]
recette: [RS-015-03]

### AC-004 : La date et le prix saisis servent d'assiette à la plus-value

**Given** une référence reprise 5 000 euros, dont le client justifie l'acquisition le 14 mars 2019 pour 3 200 euros, facture et justificatif d'achat cochés
**When** le vendeur consulte le comparatif fiscal de la référence
**Then** la plus-value est assise sur l'écart de 1 800 euros et réduite par les années de détention écoulées au-delà de la deuxième

anchoring: [R-005, R-004, PER-002]
recette: [RS-015-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-015-01 | facture, justificatif d'achat, date du 14 mars 2019 et prix de 3 200 euros ouvrent la ligne plus-value | test:src/lib/calculations/taxes.test.ts::retourne true quand toutes les conditions sont réunies |
| RS-015-02 | la facture au nom du client décochée ferme la plus-value et affiche « Non éligible » | test:src/lib/calculations/taxes.test.ts::retourne false sans facture |
| RS-015-03 | la date d'acquisition laissée vide ferme la plus-value malgré les trois autres justificatifs | test:src/lib/calculations/taxes.test.ts::retourne false sans date d'acquisition |
| RS-015-04 | une référence reprise 5 000 euros et acquise 3 200 euros affiche une plus-value assise sur 1 800 euros | manuel |
