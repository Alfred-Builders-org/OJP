---
id: F-039
---

## Criteres d'acceptation

### AC-001 : Le reste à verser d'une quittance de rachat remonte en action urgente

**Given** un lot de rachat dont la quittance QRA-2026-0042 porte 1 850,00 € nets au client, et sur laquelle 500,00 € ont déjà été versés
**When** le vendeur ouvre ce lot
**Then** une action urgente « Quittance QRA-2026-0042 | Paiement client à effectuer » s'affiche avec « Restant : 1 350,00 € », et la saisie du règlement s'ouvre déjà remplie de ce montant

anchoring: [PER-002]
recette: [RS-039-01]

### AC-002 : Un bon de commande fonderie annulé ou payé ne fait plus remonter de paiement

**Given** le bon de commande fonderie BDC-2026-0007 de 4 820,00 €, passé au statut annulé
**When** le propriétaire ouvre le lot routé sur ce bon de commande
**Then** aucun paiement fonderie ne remonte pour BDC-2026-0007, ni sur le lot ni sur le tableau de bord du jour

anchoring: [R-014, PER-001]
recette: [RS-039-02]

### AC-003 : Le solde d'une vente d'or d'investissement n'apparaît qu'une fois l'acompte encaissé

**Given** une vente d'or d'investissement de 12 000,00 €, dont l'acompte de 10 % soit 1 200,00 € n'est pas encaissé
**When** le vendeur consulte les paiements dus de ce lot
**Then** seul l'acompte de 1 200,00 € remonte, et le solde de 10 800,00 € n'apparaît qu'après encaissement complet de l'acompte

anchoring: [R-016, PER-002]
recette: [RS-039-03]

### AC-004 : Le tableau de bord du jour rassemble les paiements en attente de tous les lots

**Given** trois lots portant chacun un paiement en attente, dont un acompte de 1 200,00 € sur le lot VEN-2026-0031 du client Martin
**When** le propriétaire ouvre le tableau de bord du jour
**Then** les trois paiements en attente y figurent, celui du lot VEN-2026-0031 sous « Acompte client à encaisser (10%) » avec pour sous-titre « 1 200,00 € · VEN-2026-0031 · Martin »

anchoring: [PER-001]
recette: [RS-039-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-039-01 | sur une quittance QRA-2026-0042 de 1 850,00 € déjà réglée à hauteur de 500,00 €, le lot affiche « Restant : 1 350,00 € » et pré-remplit la saisie | manuel |
| RS-039-02 | annuler le bon de commande BDC-2026-0007 de 4 820,00 € retire son paiement fonderie des actions du lot et du tableau de bord | manuel |
| RS-039-03 | sur une vente d'or d'investissement de 12 000,00 €, le solde de 10 800,00 € n'apparaît qu'une fois l'acompte de 1 200,00 € encaissé | manuel |
| RS-039-04 | le tableau de bord du jour liste l'acompte du lot VEN-2026-0031 avec son montant, son lot et son client | manuel |
