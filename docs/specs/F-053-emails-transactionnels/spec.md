---
id: F-053
slug: emails-transactionnels
title: Envoyer au client et à l'équipe les e-mails du parcours sur des modèles éditables
epic: E-018
surface: standard
domaine: [DOM-001, DOM-012]
dependencies: [F-035]
personas: [PER-002, PER-004]
---

# Objectif

Dix envois transactionnels jalonnent le parcours, six vers le client et quatre vers l'équipe, dont les textes se modifient depuis l'application sans toucher au code. Six d'entre eux portent la pièce contractuelle correspondante en fichier joint.

## Intention

Le client particulier ne se connecte jamais à l'application : tout ce qu'il en voit passe par un courriel et le document qui l'accompagne. La formulation de ces messages est donc le produit, de son point de vue, et la laisser figée dans le code condamne le propriétaire à demander une intervention technique pour changer une phrase.

Chaque modèle vit donc dans l'application, avec son objet, son corps et la liste des variables qu'il sait remplacer. Le propriétaire réécrit un texte, l'essaie sur sa propre adresse, et le voit partir tel quel au client suivant.

Un modèle peut aussi être désactivé, ce qui suspend l'envoi sans supprimer le texte : c'est la façon de couper une notification interne devenue bruyante sans perdre sa rédaction.

## Hors-scope

- les courriels de compte et d'invitation, qui relèvent de la gestion des accès
- l'envoi groupé, la relance automatique et toute campagne commerciale
- la mise en forme libre du modèle : l'habillage de l'envoi est commun et n'est pas éditable

## Cas d'erreur

- le modèle demandé est désactivé : l'envoi est passé silencieusement, aucun courriel ne part vers le client et rien n'est présenté comme un échec
- l'envoi de test ne parvient pas à joindre le serveur : l'écran affiche « Erreur réseau » et « Impossible de contacter le serveur. », et aucun message n'est parti

## Brief produit

### Purpose

Faire du texte envoyé au client un réglage de l'application plutôt qu'une constante du code, et garantir que la pièce contractuelle voyage avec le message qui l'annonce.

### User

Le client particulier, destinataire de six des dix envois et qui ne connaît l'entreprise que par eux. Le vendeur et le propriétaire, qui déclenchent ces envois au fil du parcours et rédigent leurs textes.

### Content

Dix types d'envois : devis envoyé, contrat de rachat finalisé, contrat de dépôt-vente, facture d'acompte, facture de vente, quittance de dépôt-vente pour le client ; devis accepté, rétractation, lot finalisable, acompte expiré pour l'équipe. Un onzième, l'invendu de dépôt-vente, s'est ajouté depuis.

Chaque modèle porte un libellé, un objet, un corps, un état actif ou inactif, une catégorie client ou interne, et la liste des variables disponibles avec leur description.

L'onglet Emails des paramètres permet d'éditer l'objet et le corps, de basculer l'activation, de consulter les variables et d'envoyer un message de test. Les retours à l'écran sont « Template sauvegardé », « Email de test envoyé ! », « Erreur lors de l'envoi » et « Erreur réseau ».

## Notes techniques

Les modèles vivent dans `email_templates` (migration `033`) : `notification_type` unique, `label`, `subject`, `body`, `is_active`, `category`, `available_variables` en JSONB. La migration `057` ajoute `interne_depot_vente_invendu`.

`src/lib/email/send-notification.ts` charge le modèle (`Template not found: {type}` si absent), retourne `{ success: true }` sans rien envoyer quand `is_active` est faux et que l'appel n'est pas un test, construit la table de variables depuis client / dossier / lot / documents, substitue les `{{…}}`, télécharge les PDF depuis le bucket `documents`, rend le HTML via `EmailWrapper` et poste chez Resend, puis écrit dans `email_logs` avec `status` à `sent` ou `failed`.

`POST /api/email/send` valide le type contre `VALID_TYPES`, applique `sensitiveApiLimiter` (5 requêtes par minute et par adresse) avant tout contrôle, exige une session puis un rôle `proprietaire` ou `super_admin`. Le déclenchement depuis le navigateur passe par `triggerEmail` en tire et oublie.
