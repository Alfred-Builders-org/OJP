---
id: F-044
slug: invitation-collaborateur
title: Ouvrir un compte à un collaborateur par invitation par e-mail
epic: E-016
surface: risquee
dependencies: [F-043]
personas: [PER-001, PER-003]
---

# Objectif

Le propriétaire ouvre un accès à un collaborateur en l'invitant par son adresse, et l'invité choisit lui-même son mot de passe. Le compte reste en attente tant que ce choix n'est pas fait.

## Intention

Créer un compte pour quelqu'un d'autre suppose de lui fabriquer un mot de passe, de le lui transmettre, et d'espérer qu'il le change. Chacune de ces trois étapes est une occasion de fuite, et la dernière n'arrive presque jamais.

L'invitation renverse le geste : le propriétaire ne fournit qu'un nom et une adresse, et l'invité arrive directement sur l'écran de choix d'un mot de passe que personne d'autre ne connaîtra. Entre les deux, le compte existe mais n'ouvre rien.

Le propriétaire garde la main sur le lien : il peut le copier pour le transmettre autrement qu'en courriel, et le régénérer si l'invité ne l'a jamais reçu. Un mode de création directe, avec mot de passe temporaire, reste disponible pour le cas où le collaborateur est en face de soi et n'a pas d'adresse relevable dans la journée.

## Hors-scope

- l'élargissement du rôle d'un collaborateur déjà en place, qui relève de la gestion des droits
- la désactivation et la suppression d'un compte
- le contenu de l'écran de choix du mot de passe, qui est celui du parcours de connexion

## Cas d'erreur

- le mot de passe temporaire saisi en création directe est plus court que la longueur minimale : la création est refusée et le motif est affiché
- un nouveau lien est demandé pour un compte qui n'est plus en attente : la demande est refusée en le disant

## Brief produit

### Purpose

Ouvrir un accès nominatif à un collaborateur sans que personne, pas même le propriétaire, ne connaisse son mot de passe.

### User

Le propriétaire du comptoir, qui recrute et ouvre les accès. L'administrateur de la solution, qui fait le même geste quand il dépanne une mise en service.

### Content

Le dialogue demande un prénom, un nom et une adresse, puis propose deux modes : l'invitation, qui produit un lien à transmettre, et la création directe, qui demande un mot de passe temporaire. Une fois l'invitation partie, l'écran affiche le lien à copier. La liste des utilisateurs montre l'état d'attente jusqu'au choix du mot de passe.

## Notes techniques

Le lien produit par le service d'authentification est réécrit pour passer par le rappel maison, de sorte que l'invité atterrisse sur l'écran de choix du mot de passe et non sur une page générique.

Le rôle initial est posé par le service d'administration, qui est la seule voie autorisée à écrire un rôle sur un profil neuf : la garde de R-041 réécrirait toute autre tentative.

La route d'invitation est comptée par R-042 avec le seuil bas des routes sensibles, cinq appels par minute et par adresse appelante, et refuse tout appelant qui n'est ni propriétaire ni super-administrateur.
