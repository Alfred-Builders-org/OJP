---
id: F-006
---

## Criteres d'acceptation

### AC-001 : Chaque type de pièce garde son propre rang, remis à 1 au changement d'année

**Given** un comptoir dont le dernier dossier de 2025 porte le numéro DOS-2025-0147
**When** le vendeur ouvre le premier dossier du 2 janvier 2026 et y ajoute un lot de rachat
**Then** le dossier porte DOS-2026-0001 et le lot porte RAC-2026-0001, chaque rang étant écrit sur 4 chiffres

anchoring: [R-023, PER-002]
recette: [RS-006-01]

### AC-002 : Deux saisies faites au même instant n'obtiennent jamais le même numéro

**Given** un comptoir dont la dernière facture émise porte FAC-2026-0031
**When** deux vendeurs valident chacun une facture à la même seconde, sur deux postes différents
**Then** l'un obtient FAC-2026-0032 et l'autre FAC-2026-0033, et aucun des deux rangs n'est servi deux fois

anchoring: [R-023, PER-001]
recette: [RS-006-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-006-01 | ouvrir le premier dossier de 2026 après un dernier dossier 2025 numéroté DOS-2025-0147 et vérifier DOS-2026-0001 puis RAC-2026-0001 | manuel |
| RS-006-02 | valider deux factures à la même seconde depuis deux postes, après FAC-2026-0031, et vérifier que les deux numéros obtenus sont distincts et consécutifs | manuel |
