---
id: F-036
---

## Criteres d'acceptation

### AC-001 : Les sept états s'affichent avec le même libellé et la même couleur partout

**Given** un client Jean Dupont portant sept pièces, une aux états En attente, Accepté, Refusé, Signé, Réglé, Émis et Annulé
**When** le vendeur consulte ces pièces depuis la fiche du client, puis les mêmes pièces depuis leur dossier
**Then** chaque état porte le même libellé et la même couleur aux deux endroits : ambre pour En attente, vert pour Accepté et Réglé, rouge pour Refusé et Annulé, bleu pour Signé, gris pour Émis

anchoring: [R-032, PER-002]
recette: [RS-036-01]

### AC-002 : Une pièce passée à Annulé reste consultable, et seulement par un utilisateur connecté

**Given** un contrat de rachat CRA-2026-0012 passé à l'état Annulé après un remboursement suite à rétractation
**When** le vendeur ouvre ce contrat depuis la fiche du client, puis on tente de l'ouvrir par une adresse directe sans être connecté
**Then** le contrat reste consultable depuis l'application avec l'état Annulé, et l'adresse directe ne remet rien

anchoring: [R-025, PER-004]
recette: [RS-036-02]

### AC-003 : Un second règlement sur une pièce déjà réglée ne réécrit pas son état

**Given** une facture de vente FVE-2026-0007 de 1 200,00 € déjà à l'état Réglé après un versement de 1 200,00 €
**When** un second versement de 50,00 € est enregistré sur cette même facture
**Then** la facture reste à l'état Réglé, cet état n'est pas réécrit une seconde fois, et la date de passage à Réglé ne change pas

anchoring: [R-032, PER-001]
recette: [RS-036-03]

### AC-004 : Un versement partiel laisse la pièce ouverte et affiche le reste dû de cette pièce

**Given** une facture de vente FVE-2026-0008 de 1 200,00 € rattachée aux lignes qu'elle couvre, sur un lot qui porte aussi une autre pièce
**When** le vendeur enregistre un versement de 300,00 € sur cette facture, puis un versement complémentaire de 900,00 €
**Then** après le premier versement la facture conserve son état précédent et affiche 900,00 € de reste dû pour elle seule, et après le second elle passe à l'état Réglé

anchoring: [R-032, PER-002]
recette: [RS-036-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-036-01 | comparer les sept états En attente, Accepté, Refusé, Signé, Réglé, Émis et Annulé sur la fiche client puis sur le dossier, libellés et couleurs identiques | manuel |
| RS-036-02 | ouvrir le contrat de rachat CRA-2026-0012 passé à Annulé depuis l'application, puis tenter la même lecture par une adresse directe sans être connecté | manuel |
| RS-036-03 | enregistrer un second versement de 50,00 € sur la facture FVE-2026-0007 déjà réglée à 1 200,00 € et vérifier que l'état Réglé n'est pas réécrit | manuel |
| RS-036-04 | verser 300,00 € puis 900,00 € sur la facture FVE-2026-0008 de 1 200,00 € et suivre le reste dû propre à cette pièce jusqu'au passage à Réglé | manuel |
