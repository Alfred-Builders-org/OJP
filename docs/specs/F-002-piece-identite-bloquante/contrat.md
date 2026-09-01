---
id: F-002
---

## Criteres d'acceptation

### AC-001 : Un client sans pièce d'identité n'ouvre aucun dossier

**Given** un client Jean Dupont créé le 26 août 2026, dont la fiche ne porte aucune pièce d'identité
**When** le vendeur ouvre sa fiche et vise le bouton « Créer un dossier »
**Then** le bouton est inactif et affiche le motif « Ajoutez une pièce d'identité pour créer un dossier »

anchoring: [R-022, PER-002]
recette: [RS-002-01]

### AC-002 : Enregistrer une pièce non expirée rend le client valide sans autre geste

**Given** un client Jean Dupont sans pièce, pour qui le vendeur saisit une carte nationale d'identité numéro « 120456789012 » délivrée le 30 juin 2021 et expirant le 30 juin 2031
**When** il valide l'ajout de la pièce
**Then** la fiche porte aussitôt le badge « Valide » et le bouton « Créer un dossier » devient actif

anchoring: [R-045, PER-002, PER-004]
recette: [RS-002-02]

### AC-003 : Une pièce expirée ferme l'ouverture d'un dossier

**Given** un client dont l'unique carte nationale d'identité a expiré le 12 mars 2024
**When** le vendeur ouvre sa fiche, puis le sélecteur de client de la page Dossiers
**Then** le bouton « Créer un dossier » est inactif et affiche « La pièce d'identité du client est expirée », et ce client n'est pas proposé dans le sélecteur

anchoring: [R-022, R-045, PER-002]
recette: [RS-002-03]

### AC-004 : Une pièce qui expire en cours de dossier bloque la validation

**Given** un dossier ouvert le 1er mars 2026 pour un client dont la pièce d'identité a expiré le 15 mars 2026
**When** le vendeur tente de valider ce dossier le 20 mars 2026
**Then** la validation est refusée et le message « Le client n'est plus valide. Veuillez vérifier sa pièce d'identité avant de valider le dossier. » s'affiche

anchoring: [R-022, PER-002, PER-004]
recette: [RS-002-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-002-01 | viser « Créer un dossier » sur un client sans aucune pièce d'identité : le bouton reste inactif et dit pourquoi | manuel |
| RS-002-02 | enregistrer une carte d'identité expirant le 30 juin 2031 fait passer la fiche sur « Valide » et débloque la création de dossier | manuel |
| RS-002-03 | un client dont la pièce a expiré le 12 mars 2024 n'ouvre pas de dossier et sort du sélecteur de la page Dossiers | manuel |
| RS-002-04 | valider un dossier ouvert le 1er mars 2026 pour un client dont la pièce a expiré le 15 mars 2026 est refusé | manuel |
