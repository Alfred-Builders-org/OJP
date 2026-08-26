---
id: F-013
---

## Criteres d'acceptation

### AC-001 : Un versement au client sur une affaire close est refusé

**Given** l'affaire RAC-2026-0010, fermée avec l'issue « rétracté »
**When** le vendeur tente d'enregistrer un versement de 1 250,00 EUR au client sur cette affaire
**Then** l'enregistrement est refusé et l'écran affiche « Aucun paiement n'est du sur le lot RAC-2026-0010 : l'operation est close (retracte). »

anchoring: [R-014, PER-002]
recette: [RS-013-01]

### AC-002 : Un mouvement entrant reste permis sur une affaire close

**Given** l'affaire RAC-2026-0013, fermée avec l'issue « refusé », sur laquelle le client doit rendre 1 250,00 EUR déjà perçus
**When** le vendeur enregistre l'entrée en caisse de ces 1 250,00 EUR
**Then** le mouvement est accepté et le total réglé de l'affaire retombe à 0,00 EUR

anchoring: [R-015, PER-002]
recette: [RS-013-02]

### AC-003 : La vue du jour ne réclame plus de paiement sur une affaire sans suite

**Given** 4 affaires closes portant respectivement les issues « rétracté », « refusé », « annulé » et une opération menée à son terme
**When** le propriétaire ouvre sa vue du jour
**Then** seule l'opération menée à son terme figure parmi les paiements dus, les 3 autres en sont écartées

anchoring: [R-014, PER-001]
recette: [RS-013-03, RS-013-04]

### AC-004 : Un échec d'une autre nature reste annoncé comme tel

**Given** l'affaire RAC-2026-0021, encore en cours, sur laquelle un versement de 300,00 EUR ne peut être inscrit pour une raison étrangère à la clôture
**When** le vendeur valide ce versement
**Then** l'écran annonce « Le règlement n'a pas pu être enregistré. » suivi du motif rencontré

anchoring: [R-014, PER-002]
recette: [RS-013-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-013-01 | verser 1 250,00 EUR au client sur RAC-2026-0010 rétractée est refusé et le motif de clôture est affiché tel quel | manuel |
| RS-013-02 | encaisser les 1 250,00 EUR rendus par le client sur RAC-2026-0013 refusée est accepté et ramène le total réglé à 0,00 EUR | manuel |
| RS-013-03 | une affaire rétractée, refusée ou annulée est écartée de la liste des paiements dus, une affaire menée à terme y reste | test:src/components/dashboard/dashboard-helpers.test.ts::couvre toutes les issues déclarées sans suite |
| RS-013-04 | la vue du jour ne propose de paiement que sur les affaires encore ouvertes ou menées à leur terme | manuel |
| RS-013-05 | un échec de saisie étranger à la clôture est annoncé avec le préfixe « Le règlement n'a pas pu être enregistré. » | manuel |
