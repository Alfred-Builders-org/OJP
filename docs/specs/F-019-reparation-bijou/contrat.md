---
id: F-019
---

## Criteres d'acceptation

### AC-001 : Le coût réel de la réparation s'ajoute au prix demandé à la vente

**Given** un bracelet en stock au prix de revente de 380,00 EUR, envoyé en réparation pour « Remplacement du fermoir, polissage... » avec un coût estimé de 45,00 EUR
**When** le vendeur enregistre le retour avec un coût réel de 52,00 EUR, puis ajoute ce bracelet à une vente
**Then** le bracelet est de nouveau en stock, son historique porte une réparation marquée « Terminée », et le prix proposé à la vente est de 432,00 EUR

anchoring: [PER-002]
recette: [RS-019-01, RS-019-02]

### AC-002 : Une pièce déjà chez le réparateur ne peut pas repartir une seconde fois

**Given** un collier envoyé en réparation le 3 mars 2026, dont l'historique porte une réparation marquée « En cours »
**When** le vendeur ouvre la fiche de ce collier pour l'envoyer de nouveau en réparation
**Then** l'envoi en réparation ne lui est pas proposé et aucune seconde réparation n'est enregistrée tant que le retour du 3 mars n'a pas été saisi

anchoring: [PER-002]
recette: [RS-019-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-019-01 | envoyer en réparation un bracelet en stock avec un coût estimé de 45,00 EUR, puis enregistrer le retour à 52,00 EUR et vérifier qu'il revient en stock avec une réparation « Terminée » | manuel |
| RS-019-02 | ajouter à une vente ce bracelet de prix de revente 380,00 EUR réparé pour 52,00 EUR et vérifier que le prix proposé est de 432,00 EUR | manuel |
| RS-019-03 | ouvrir la fiche d'un collier ayant une réparation « En cours » et vérifier qu'un second envoi en réparation n'est pas possible | manuel |
