---
id: F-052
slug: notifications-internes
title: Notifier dans l'application les événements qui appellent une action
epic: E-018
surface: standard
domaine: [DOM-003, DOM-004]
dependencies: [F-005, F-043]
personas: [PER-002, PER-001]
---

# Objectif

Les événements du parcours qui appellent une action déposent une notification dans l'application, chez chaque utilisateur actif : dossier créé, lot accepté, finalisé ou rétracté, vente créée, livrée ou terminée, commande reçue. Chacun ne voit que les siennes, et choisit dans les paramètres les types qu'il veut recevoir.

## Intention

Au comptoir, ce qui vient de se passer ailleurs dans l'application ne se voit pas. Un dossier ouvert par un collègue, un lot passé en rétractation, une vente livrée : chacun ne l'apprend qu'en rouvrant l'écran concerné, souvent trop tard.

Une cloche qui compte les événements non lus rend l'activité de la boutique visible sans que personne n'ait à surveiller quoi que ce soit. Le compteur descend au fur et à mesure qu'on prend connaissance, et le panneau conduit vers l'objet concerné.

Le contrepoids est le bruit : une notification à chaque mouvement finit par être ignorée en bloc. Chaque type se désactive donc individuellement, et le réglage vaut pour l'ensemble de la boutique.

## Hors-scope

- l'alerte sur les lots finalisables, les acomptes expirés et les échéances de contrat de dépôt-vente, qui n'existe qu'en courriel et hors de la cloche
- la notification poussée hors de l'application, sur le poste ou le téléphone
- l'adressage d'une notification à un utilisateur en particulier : tout événement du parcours part vers tous les utilisateurs actifs

## Cas d'erreur

- le type d'événement a été désactivé dans les paramètres : l'événement se produit, aucune notification n'est déposée, et rien ne le signale à celui qui a désactivé
- aucune notification n'a jamais été déposée pour l'utilisateur : le panneau affiche « Aucune notification. » plutôt qu'une liste vide

## Brief produit

### Purpose

Rendre visible, sans aller la chercher, l'activité qui appelle une décision, et laisser chacun décider de ce qu'il veut voir.

### User

Le vendeur au comptoir, qui découvre ainsi ce qu'un collègue vient d'ouvrir ou de finaliser. Le propriétaire, qui suit l'activité de la boutique sans ouvrir chaque dossier.

### Content

Une cloche dans l'en-tête, portant le nombre de notifications non lues, plafonné à « 99+ ». Le panneau s'intitule « Notifications », propose « Tout marquer comme lu » et liste les événements du plus récent au plus ancien, chacun avec son titre, son message et le lien vers l'objet concerné.

Les titres viennent des événements eux-mêmes : « Nouveau dossier », « Lot accepté », « Lot finalisé », « Lot rétracté », « Nouvelle vente », « Vente livrée », « Vente terminée ».

L'onglet Notifications des paramètres regroupe les types par famille (Dossiers, Lots, Ventes et Commandes, Autres) avec un interrupteur chacun, et règle la fréquence des vérifications automatiques des lots finalisables et des acomptes expirés, de 5 minutes à 2 heures.

## Notes techniques

La table `notifications` (migration `031`) porte une ligne par utilisateur, onze valeurs de `type`, une RLS `auth.uid() = user_id` en lecture, mise à jour et suppression, et une publication dans `supabase_realtime`.

Les helpers `create_notification` et `notify_all_users` sont en `SECURITY DEFINER` ; `notify_all_users` réécrit par la migration `094` consulte les préférences avant d'insérer, et ne cible que les profils `status = 'active'`. La migration `110` lève une ambiguïté de nommage dans cette fonction.

Trois déclencheurs alimentent la table (migrations `032` et `094`) : insertion dans `dossiers`, changement de `lots.status` pour un lot de rachat ou de dépôt-vente, changement de `lots.status` pour une vente.

**Dette connue** : les déclencheurs de la migration `032` testent encore des valeurs de `lots.status` (`accepte`, `retracte`, `livre`, `termine`) qui n'existent plus depuis la migration `081` ; la migration `094` les remplace mais l'écart mérite d'être vérifié à chaque reprise. Les vérifications de lots finalisables et d'acomptes expirés vivent dans les fonctions courriel des migrations `034` et `057`, non programmées à ce jour.
