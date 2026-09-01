---
id: F-005
---

## Criteres d'acceptation

### AC-001 : Un dossier s'ouvre sur un client en règle et reçoit son numéro

**Given** un client dont la pièce d'identité court jusqu'au 30 juin 2031 et qui apporte 3 bagues et 1 lingot le même jour
**When** le vendeur ouvre un dossier en choisissant ce client dans le sélecteur « Client * » de l'écran de création
**Then** le dossier est créé avec un numéro attribué tout seul, l'état « Ouvert », le rappel du téléphone, de l'adresse électronique et de la ville du client, et le message « Dossier créé »

anchoring: [R-022, PER-002]
recette: [RS-005-01]

### AC-002 : Un client qui n'est plus en règle bloque la finalisation du dossier

**Given** un dossier ouvert dont le client est devenu invalide, sa carte d'identité ayant expiré le 12 mars 2024
**When** le vendeur clique sur « Finaliser le dossier »
**Then** la finalisation est refusée et l'écran affiche « Le client n'est plus valide. Veuillez vérifier sa pièce d'identité avant de valider le dossier. »

anchoring: [R-022, PER-002]
recette: [RS-005-02]

### AC-003 : Un dossier qui a quitté le brouillon n'accepte plus de lot

**Given** le dossier DOS-2026-0008, déjà validé, qui porte 1 lot de rachat
**When** le vendeur tente d'y ajouter un 2e lot, de type vente
**Then** l'ajout est refusé et l'écran affiche « Impossible d'ajouter un lot à un dossier validé. Veuillez créer un nouveau dossier. »

anchoring: [R-012, PER-002]
recette: [RS-005-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-005-01 | ouvrir un dossier sur un client dont la pièce court jusqu'au 30 juin 2031, vérifier le numéro attribué, l'état Ouvert et le rappel téléphone / adresse électronique / ville | manuel |
| RS-005-02 | finaliser un dossier dont le client est devenu invalide (pièce expirée le 12 mars 2024) est refusé avec le message de vérification de la pièce | manuel |
| RS-005-03 | ajouter un 2e lot au dossier DOS-2026-0008 déjà validé est refusé avec l'invitation à créer un nouveau dossier | manuel |
