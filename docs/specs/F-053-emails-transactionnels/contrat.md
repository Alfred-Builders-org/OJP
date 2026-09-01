---
id: F-053
---

## Criteres d'acceptation

### AC-001 : Les envois enchaînés depuis un même poste sont refusés au delà du seuil

**Given** un poste qui a déjà déclenché 5 envois de courriel dans la même minute
**When** un 6e envoi part depuis ce poste avant la fin de la fenêtre
**Then** il est refusé avant même que la session et le rôle soient vérifiés, et les envois repartent normalement à la fenêtre suivante

anchoring: [R-042, PER-002]
recette: [RS-053-01]

### AC-002 : Un modèle désactivé suspend l'envoi sans le signaler comme un échec

**Given** le modèle « Devis envoyé » basculé sur inactif dans l'onglet Emails des paramètres
**When** le vendeur envoie le devis DEV-2026-0031 à un client
**Then** aucun courriel n'arrive chez le client, l'opération n'est pas présentée comme un échec, et le texte du modèle reste intact pour une réactivation

anchoring: [PER-004, PER-002]
recette: [RS-053-02]

### AC-003 : Un envoi de test qui ne joint pas le serveur le dit à l'écran

**Given** l'onglet Emails ouvert sur le modèle « Devis envoyé », avec le serveur injoignable
**When** le propriétaire lance un envoi de test vers sa propre adresse
**Then** l'écran affiche « Erreur réseau » avec la précision « Impossible de contacter le serveur. », et aucun message n'est parti

anchoring: [PER-002, PER-004]
recette: [RS-053-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-053-01 | le 6e envoi de courriel déclenché dans la même minute depuis un même poste est refusé | manuel |
| RS-053-02 | désactiver le modèle « Devis envoyé » puis envoyer le devis DEV-2026-0031 n'expédie aucun courriel et ne signale pas d'échec | manuel |
| RS-053-03 | lancer un envoi de test serveur injoignable affiche « Erreur réseau » et « Impossible de contacter le serveur. » | manuel |
