---
id: F-037
---

## Criteres d'acceptation

### AC-001 : Le préfixe réglé pour le bon de livraison est repris au numéro suivant

**Given** un comptoir dont le préfixe du bon de livraison vaut « BDL » et dont la dernière pièce de ce type émise en 2026 porte le numéro BDL-2026-0003
**When** le propriétaire remplace ce préfixe par « LIV » dans l'onglet « Documents » des Paramètres, l'enregistre, puis émet un nouveau bon de livraison
**Then** le nouveau bon porte le numéro LIV-2026-0001, la série précédente en BDL-2026 reste intacte, et aucun numéro déjà attribué n'est réutilisé

anchoring: [R-023, PER-001]
recette: [RS-037-01]

### AC-002 : Une couleur principale hors format est signalée à la sortie du champ

**Given** le propriétaire dans le bloc « Apparence » de l'onglet « Documents », dont la couleur principale vaut « #C8A84E »
**When** il remplace cette valeur par « doré » et quitte le champ
**Then** le message « Format de couleur invalide » s'affiche avec le rappel « Utilisez le format hexadécimal #RRGGBB. », et le nuancier reste sur la couleur valide

anchoring: [PER-001]
recette: [RS-037-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-037-01 | remplacer le préfixe du bon de livraison « BDL » par « LIV » après BDL-2026-0003, puis émettre un bon de livraison et vérifier le numéro LIV-2026-0001 | manuel |
| RS-037-02 | saisir « doré » dans la couleur principale à la place de « #C8A84E » et quitter le champ pour voir « Format de couleur invalide » | manuel |
