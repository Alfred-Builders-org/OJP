---
id: F-041
---

## Criteres d'acceptation

### AC-001 : Un cours qui s'écarte de plus de 30 % du dernier relevé est refusé et le motif est dit

**Given** le dernier relevé connu porte l'argent à 1,800 euro le gramme, et le propriétaire saisit 45,00 euros le gramme pour l'argent
**When** il enregistre les trois prix depuis Paramètres, onglet Prix
**Then** l'enregistrement est refusé, l'écran affiche « Cours de l'argent invraisemblable : 45,000 EUR/g contre 1,800 EUR/g au dernier relevé. Vérifiez la saisie, ou forcez si l'écart est réel. » et l'argent reste à 1,800 euro le gramme

anchoring: [R-017, PER-001]
recette: [RS-041-01]

### AC-002 : Le relevé automatique ne force jamais et laisse les cours de la veille

**Given** le dernier relevé connu porte l'or à 113,357 euros le gramme, et la source annonce ce matin 45,000 euros le gramme pour l'or
**When** le relevé automatique du jour tente d'enregistrer les trois cours
**Then** rien n'est enregistré, l'or reste à 113,357 euros le gramme, et le passage en force n'est pas tenté puisqu'il est réservé au propriétaire

anchoring: [R-017, R-020, PER-001]
recette: [RS-041-02]

### AC-003 : Un prix qui n'est pas strictement positif est refusé

**Given** le propriétaire saisit 113,357 euros le gramme pour l'or, 0 pour l'argent et 30,812 euros le gramme pour le platine
**When** il enregistre les trois prix
**Then** l'enregistrement est refusé au motif que les trois métaux doivent être strictement positifs, et aucun des trois cours n'est modifié

anchoring: [R-017, PER-001]
recette: [RS-041-03]

### AC-004 : Une valeur non numérique est arrêtée avant tout enregistrement

**Given** le propriétaire saisit « 1,8O » pour l'argent, la lettre O ayant remplacé le zéro
**When** il enregistre les trois prix
**Then** l'écran affiche « Veuillez saisir des valeurs numériques valides pour les prix. » et aucun cours n'est enregistré

anchoring: [PER-001]
recette: [RS-041-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-041-01 | saisir l'argent à 45,00 euros le gramme alors que le dernier relevé vaut 1,800 est refusé avec le message nommant le métal et les deux valeurs | manuel |
| RS-041-02 | un relevé automatique annoncant l'or à 45,000 euros le gramme contre 113,357 au dernier relevé n'écrit rien et ne force pas | manuel |
| RS-041-03 | enregistrer les prix avec l'argent à 0 est refusé et laisse les trois cours inchangés | manuel |
| RS-041-04 | saisir « 1,8O » pour l'argent affiche le message de valeurs numériques invalides | manuel |
