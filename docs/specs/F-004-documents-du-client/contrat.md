---
id: F-004
---

## Criteres d'acceptation

### AC-001 : Les pièces émises pour un client se retrouvent sur sa fiche et s'ouvrent par un lien temporaire

**Given** un client Jean Dupont pour qui deux pièces ont été émises, une Quittance au statut « Réglé » datée du 12 août 2026 et un Devis au statut « En attente » daté du 20 août 2026
**When** le vendeur ouvre sa fiche et télécharge la quittance depuis le bloc « Documents du client »
**Then** les deux pièces sont listées avec leur numéro, leur type, leur statut et leur date, le Devis du 20 août 2026 en tête, et la quittance s'ouvre par un lien temporaire délivré à l'utilisateur connecté

anchoring: [R-025, PER-002, PER-004]
recette: [RS-004-01]

### AC-002 : Un téléchargement qui échoue le dit et ne propose aucun lien public

**Given** un client Jean Dupont dont la Quittance du 12 août 2026 ne peut pas être remise
**When** le vendeur demande le téléchargement de cette quittance depuis le bloc « Documents du client »
**Then** le téléchargement échoue, le message « Impossible de télécharger le document » s'affiche, et aucune adresse publique n'est proposée en remplacement

anchoring: [R-025, PER-002]
recette: [RS-004-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-004-01 | ouvrir la fiche d'un client portant une quittance du 12 août 2026 et un devis du 20 août 2026, puis télécharger la quittance depuis le bloc « Documents du client » | manuel |
| RS-004-02 | un téléchargement de quittance qui échoue affiche « Impossible de télécharger le document » sans proposer d'adresse publique | manuel |
