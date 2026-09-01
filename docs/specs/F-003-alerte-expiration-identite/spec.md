---
id: F-003
slug: alerte-expiration-identite
title: Alerter quand une pièce d'identité approche de son expiration
epic: E-001
surface: risquee
domaine: [DOM-002]
dependencies: [F-002]
personas: [PER-001, PER-002]
---

# Objectif

Prévenir avant blocage, sur un seuil de jours réglable. L'échéance apparaît au tableau de bord tant qu'il reste du temps pour demander une pièce à jour.

## Intention

Une pièce d'identité périme à date fixe, et ce jour-là le client cesse de pouvoir ouvrir une opération sans que personne n'ait rien changé. Découvert au comptoir, ce refus est un client debout devant un vendeur qui ne peut rien faire pour lui : il faut le renvoyer chez lui chercher un document, et l'opération est perdue ou reportée.

L'alerte déplace ce moment. Le propriétaire ouvre son tableau de bord le matin, voit les pièces qui approchent du terme, et le comptoir peut réclamer la pièce à jour lors de la visite suivante, avant l'échéance. Le nom du client est affiché parce que c'est lui qu'on va contacter, et la date parce que c'est elle qui dit s'il y a urgence.

Le nombre de jours d'avance n'est pas le même pour tous les comptoirs, ni pour toutes les saisons : il se règle depuis l'application, par le propriétaire, sans passer par une livraison.

## Hors-scope

- l'envoi d'un rappel par courriel ou par message au client : l'alerte vit sur le tableau de bord et ne sort pas de l'application
- le blocage lui-même, qui appartient à la capacité qui rend la pièce opposable : cette alerte informe, elle n'empêche rien
- les pièces secondaires d'un client : seule la pièce principale est surveillée

## Cas d'erreur

- la pièce est déjà expirée au moment où le tableau de bord s'affiche : aucune alerte n'est produite, le client sort de la carte Alertes alors même que ses opérations sont désormais bloquées

## Brief produit

### Purpose

Donner d'un coup d'oeil, chaque matin, la liste des clients dont la pièce va cesser d'être valable, avec assez d'avance pour agir.

### User

Le propriétaire du comptoir, qui ouvre l'application le matin et veut savoir en un écran ce qui appelle une action. Le vendeur, qui préfère réclamer un document lors d'une visite plutôt que de refuser une opération.

### Content

Sur la carte Alertes du tableau de bord, une ligne par pièce qui arrive à terme : le libellé « CNI bientôt expirée » ou « Passeport bientôt expiré » selon le type, le nom du client en sous-titre, la date d'expiration en marque. Les plus proches du terme sont en tête, et la ligne mène à la fiche du client.

Le nombre de jours d'avance se règle dans Paramètres, sur la carte des règles métier du dépôt-vente, sous le seuil d'alerte d'identité. Trente jours à défaut de réglage.

## Notes techniques

`src/app/(dashboard)/dashboard/page.tsx:36-41` lit `settings.business_rules.seuil_alerte_identite_jours` (défaut 30 si absent) et le passe à `DashboardAlertsServer`. La requête de `src/components/dashboard/dashboard-alerts-server.tsx:59-67` retient les `client_identity_documents` avec `is_primary = true` et `expiry_date` comprise entre `now()` et `now() + seuil`, triés par expiration croissante : c'est le `gte("expiry_date", now)` qui exclut structurellement les pièces déjà expirées. Rendu des lignes dans `dashboard-alerts.tsx:223-224`. Le seuil est l'un des treize de R-024, stocké par `supabase/migrations/038_create_settings.sql` et modifié depuis `src/components/parametres/regles-metier-tab.tsx:292`.
