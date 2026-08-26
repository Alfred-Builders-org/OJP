---
id: F-035
---

## Criteres d'acceptation

### AC-001 : Deux émissions simultanées du même type reçoivent deux numéros distincts

**Given** deux vendeurs qui émettent chacun une quittance de rachat à la même seconde, sur un comptoir où la dernière quittance émise en 2026 porte le numéro QRA-2026-0041
**When** les deux quittances sont émises
**Then** les deux pièces portent des numéros différents, QRA-2026-0042 et QRA-2026-0043, et aucun numéro n'est attribué deux fois

anchoring: [R-023]
recette: [RS-035-01]

### AC-002 : Une pièce émise n'est lisible que par un utilisateur connecté

**Given** une quittance de rachat QRA-2026-0042 qui vient d'être émise pour le client Jean Dupont
**When** on tente d'ouvrir cette quittance par une adresse directe, sans être connecté à l'application
**Then** la pièce n'est pas remise, et sa lecture n'est possible que par un accès temporaire délivré à un utilisateur connecté

anchoring: [R-025, PER-004]
recette: [RS-035-02]

### AC-003 : Un dépôt qui échoue ne laisse ni numéro consommé ni pièce incomplète

**Given** une quittance de rachat en cours d'émission dont le dépôt dans l'espace fermé des documents échoue
**When** le vendeur déclenche cette émission depuis le lot concerné
**Then** l'émission échoue, la pièce n'apparaît ni sur le dossier ni sur la fiche du client, et aucune ligne incomplète ne subsiste

anchoring: [R-023]
recette: [RS-035-03]

### AC-004 : L'en-tête et le pied de page reprennent l'identité réglée en Paramètres

**Given** une société réglée en Paramètres au nom « Or au Juste Prix », 4 Grande Rue 74160 St Julien en Genevois, téléphone 06 78 87 75 78, SIRET 928 126 390 R.C.S. Thonon-les-Bains, et dont la forme juridique est laissée vide
**When** le vendeur émet une quittance de rachat pour le client Jean Dupont
**Then** l'entête et le pied de page de la quittance portent ce nom, cette adresse complète, ce téléphone et ce SIRET, et la forme juridique laissée vide est remplacée par l'identité par défaut du comptoir

anchoring: [PER-004]
recette: [RS-035-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-035-01 | émettre deux quittances de rachat à la même seconde après QRA-2026-0041 et vérifier que les numéros QRA-2026-0042 et QRA-2026-0043 sont distincts | manuel |
| RS-035-02 | tenter d'ouvrir la quittance QRA-2026-0042 par une adresse directe sans être connecté, puis l'ouvrir depuis l'application | manuel |
| RS-035-03 | provoquer l'échec du dépôt d'une quittance de rachat et vérifier qu'aucune pièce ni ligne incomplète ne subsiste | manuel |
| RS-035-04 | régler l'identité de société « Or au Juste Prix », 4 Grande Rue 74160 St Julien en Genevois, en laissant la forme juridique vide, puis émettre une quittance et lire son entête et son pied de page | manuel |
