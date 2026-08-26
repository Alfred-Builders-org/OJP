---
id: F-003
---

## Criteres d'acceptation

### AC-001 : Une pièce qui expire dans le seuil apparaît dans les alertes

**Given** un client Jean Dupont dont la carte nationale d'identité expire le 12 septembre 2026, et un seuil d'alerte d'identité réglé à 30 jours
**When** le propriétaire ouvre le tableau de bord le 26 août 2026
**Then** la carte Alertes affiche une ligne « CNI bientôt expirée » portant « Jean Dupont » en sous-titre et la date du 12 septembre 2026

anchoring: [R-022, PER-001]
recette: [RS-003-01]

### AC-002 : Le seuil d'avance se règle depuis les paramètres

**Given** un passeport qui expire le 5 octobre 2026, absent des alertes tant que le seuil d'alerte d'identité vaut 30 jours
**When** le propriétaire porte ce seuil à 60 jours dans Paramètres, puis rouvre le tableau de bord le 26 août 2026
**Then** la carte Alertes affiche désormais la ligne « Passeport bientôt expiré » pour ce client

anchoring: [R-024, PER-001]
recette: [RS-003-02]

### AC-003 : Une pièce déjà expirée ne produit aucune alerte

**Given** une cliente Marie Durand dont la carte nationale d'identité a expiré le 12 mars 2024
**When** le vendeur ouvre le tableau de bord le 26 août 2026
**Then** aucune ligne de la carte Alertes ne concerne cette pièce, et le refus ne se constate qu'en tentant d'ouvrir un dossier sur cette fiche

anchoring: [R-022, PER-002]
recette: [RS-003-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-003-01 | une carte d'identité expirant le 12 septembre 2026 apparaît dans la carte Alertes du 26 août 2026 avec le seuil de 30 jours | manuel |
| RS-003-02 | porter le seuil d'alerte d'identité de 30 à 60 jours fait apparaître un passeport expirant le 5 octobre 2026 | manuel |
| RS-003-03 | une carte d'identité expirée le 12 mars 2024 ne produit aucune ligne dans la carte Alertes | manuel |
