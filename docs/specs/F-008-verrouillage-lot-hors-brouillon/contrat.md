---
id: F-008
---

## Criteres d'acceptation

### AC-001 : Un lot sorti du brouillon n'accepte plus ni ajout ni retrait de référence

**Given** le lot de rachat RAC-2026-0003, passé en cours, qui porte 2 références chiffrées 414,38 euros et 111,79 euros
**When** le vendeur ouvre ce lot pour y ajouter une 3e référence ou en retirer une
**Then** ni le formulaire d'ajout de référence ni le retrait ne lui sont proposés, et le lot reste à ses 2 références pour un total inchangé

anchoring: [R-013, PER-002]
recette: [RS-008-01]

### AC-002 : Un lot avance de brouillon à finalisé et ne revient jamais en arrière

**Given** un lot de rachat en brouillon rattaché à un dossier ouvert le 2 janvier 2026
**When** le vendeur finalise le dossier, puis le lot va jusqu'au terme de son parcours
**Then** le lot passe de brouillon à en cours puis à finalisé, et la façon dont il s'est terminé se lit à part de son état

anchoring: [R-010, PER-002]
recette: [RS-008-02]

### AC-003 : Une remise en arrière sur un lot finalisé est rejetée

**Given** le lot de rachat RAC-2026-0003, déjà finalisé depuis le 12 février 2026
**When** une remise de ce lot en cours est tentée
**Then** la remise est rejetée et le motif donné est « Transition de statut invalide: finalise → en_cours »

anchoring: [R-010, PER-002]
recette: [RS-008-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-008-01 | ouvrir le lot RAC-2026-0003 passé en cours et vérifier qu'aucun ajout ni retrait de référence n'est proposé, le total restant celui de ses 2 références | manuel |
| RS-008-02 | suivre un lot de rachat de brouillon à en cours puis à finalisé et vérifier qu'aucun retour vers un état antérieur n'est offert | manuel |
| RS-008-03 | tenter de remettre en cours le lot RAC-2026-0003 déjà finalisé et lire le motif de rejet de la transition | manuel |
