---
id: F-023
---

## Criteres d'acceptation

### AC-001 : L'acompte et le solde se déduisent du total de la vente et de la part réglée au comptoir

**Given** une vente d'or d'investissement de 2 400,00 € TTC, dans un comptoir dont la part d'acompte est réglée à 10 % dans les paramètres
**When** le vendeur finalise le dossier qui porte cette vente
**Then** un acompte de 240,00 € et un solde de 2 160,00 € sont établis, chacun avec sa facture, et le solde est attendu sous 48 heures

anchoring: [R-024, PER-002, PER-004]
recette: [RS-023-01]

### AC-002 : Le solde n'est proposé à l'encaissement qu'une fois l'acompte réglé

**Given** une vente de 2 400,00 € dont l'acompte de 240,00 € n'est pas encore encaissé
**When** le vendeur consulte les paiements dus sur cette vente
**Then** seule la ligne « Acompte client à encaisser (10%) » est proposée, et aucune ligne de solde n'apparaît

anchoring: [R-016, PER-002]
recette: [RS-023-02]

### AC-003 : L'acompte encaissé, la fiche l'annonce et le solde devient encaissable

**Given** une vente de 2 400,00 € dont l'acompte de 240,00 € vient d'être encaissé
**When** le vendeur rouvre la fiche de cette vente
**Then** la fiche affiche « Acompte de 240,00 € encaissé. » et les paiements dus proposent désormais la ligne « Solde client à encaisser (90%) »

anchoring: [R-016, PER-002]
recette: [RS-023-03]

### AC-004 : L'échéance franchie, la fiche annonce l'annulation à venir de la commande

**Given** une vente dont l'acompte de 240,00 € est encaissé et dont l'échéance de solde, fixée 48 heures après la finalisation, est franchie
**When** le vendeur ouvre la fiche de cette vente
**Then** la fiche affiche « Délai de paiement expiré » et prévient que la commande sera annulée automatiquement

anchoring: [R-016, PER-004]
recette: [RS-023-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-023-01 | finaliser une vente d'or d'investissement de 2 400,00 € établit un acompte de 240,00 € et un solde de 2 160,00 € attendu sous 48 heures | manuel |
| RS-023-02 | sur une vente dont l'acompte de 240,00 € reste dû, les paiements dus ne proposent que la ligne d'acompte | manuel |
| RS-023-03 | une fois l'acompte de 240,00 € encaissé, la fiche l'annonce et le solde de 2 160,00 € devient encaissable | manuel |
| RS-023-04 | une vente dont l'échéance de solde est franchie annonce l'expiration du délai et l'annulation à venir | manuel |
