---
id: F-043
---

## Criteres d'acceptation

### AC-001 : Un identifiant erroné est refusé sans dire quel champ est en cause

**Given** un vendeur qui saisit l'adresse vous@exemple.com et le mot de passe « Comptoir2024 » alors qu'aucun compte ne porte ce couple
**When** il valide la carte « Connexion »
**Then** l'accès est refusé et l'écran affiche le seul message « Email ou mot de passe incorrect. », sans préciser si c'est l'adresse ou le mot de passe qui est faux

anchoring: [R-030, PER-002]
recette: [RS-043-01]

### AC-002 : Un compte qui vient de naître n'ouvre que le travail de comptoir

**Given** une personne qui s'inscrit avec le prénom « Lucie », le nom « Martin », l'adresse lucie.martin@exemple.com et un mot de passe de 10 caractères
**When** elle confirme son adresse depuis l'écran « Vérifiez votre email » puis se connecte
**Then** son compte est actif avec le rôle vendeur, et les écrans réservés au propriétaire restent fermés pour elle

anchoring: [R-029, PER-002]
recette: [RS-043-02]

### AC-003 : Un mot de passe trop court est refusé à la réinitialisation

**Given** un vendeur arrivé sur l'écran « Nouveau mot de passe » par le lien reçu après avoir demandé « Mot de passe oublié »
**When** il saisit deux fois « abc12 », soit 5 caractères, puis valide
**Then** le changement est refusé et l'écran affiche « Le mot de passe doit contenir au moins 6 caractères. »

anchoring: [PER-002]
recette: [RS-043-03]

### AC-004 : Le retour d'authentification n'emmène jamais hors de l'application

**Given** un lien de retour d'authentification fabriqué pour renvoyer vers le site externe evil.com
**When** ce lien est ouvert dans un navigateur
**Then** la destination externe est ignorée et la personne se retrouve sur la page de connexion du comptoir

anchoring: [R-030]
recette: [RS-043-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-043-01 | se connecter avec vous@exemple.com et un mot de passe inconnu affiche « Email ou mot de passe incorrect. » | manuel |
| RS-043-02 | s'inscrire comme Lucie Martin puis se connecter donne un compte vendeur sans accès aux écrans du propriétaire | manuel |
| RS-043-03 | saisir deux fois « abc12 » sur l'écran Nouveau mot de passe est refusé avec le message de longueur minimale | manuel |
| RS-043-04 | un lien de retour d'authentification pointant vers evil.com ramène sur la page de connexion | test:e2e/security.spec.ts::auth callback rejects open redirect |
