---
id: F-044
---

## Criteres d'acceptation

### AC-001 : Une invitation ouvre un compte en attente dont le lien mène au choix du mot de passe

**Given** le propriétaire remplit le dialogue d'invitation avec le prénom « Camille », le nom « Roux » et l'adresse camille.roux@exemple.com, en mode invitation
**When** il valide l'envoi, puis Camille ouvre le lien reçu
**Then** le dialogue affiche « Vendeur invité » avec un lien à copier, le compte figure en attente au rôle vendeur, et Camille arrive sur l'écran « Nouveau mot de passe »

anchoring: [R-041, PER-001]
recette: [RS-044-01]

### AC-002 : Un mot de passe temporaire trop court est refusé

**Given** le propriétaire choisit le mode de création directe pour camille.roux@exemple.com et saisit « 12345 », soit 5 caractères, comme mot de passe temporaire
**When** il valide la création du compte de camille.roux@exemple.com avec ce mot de passe de 5 caractères
**Then** le compte n'est pas créé et l'écran affiche « Le mot de passe doit contenir au moins 6 caractères »

anchoring: [PER-001]
recette: [RS-044-02]

### AC-003 : Un nouveau lien n'est produit que pour un compte encore en attente

**Given** un vendeur dont le compte est actif depuis qu'il a choisi son mot de passe
**When** le propriétaire demande un nouveau lien d'invitation pour ce compte depuis la gestion des utilisateurs
**Then** la demande est refusée avec le motif « L'utilisateur n'est pas en attente », et aucun lien n'est affiché

anchoring: [PER-001]
recette: [RS-044-03]

### AC-004 : Les demandes d'invitation en rafale sont freinées

**Given** un poste depuis lequel 5 demandes d'invitation ont déjà été envoyées dans la minute écoulée
**When** une sixième demande part depuis ce même poste avant la fin de cette minute
**Then** elle est refusée sans créer de compte, et redevient possible une fois la minute écoulée

anchoring: [R-042, PER-003]
recette: [RS-044-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-044-01 | inviter Camille Roux à camille.roux@exemple.com donne un compte en attente au rôle vendeur et un lien qui mène à l'écran Nouveau mot de passe | manuel |
| RS-044-02 | créer directement un compte avec le mot de passe temporaire « 12345 » est refusé | manuel |
| RS-044-03 | demander un nouveau lien pour un compte déjà actif est refusé avec « L'utilisateur n'est pas en attente » | manuel |
| RS-044-04 | envoyer six demandes d'invitation dans la même minute depuis un même poste fait refuser la sixième | manuel |
