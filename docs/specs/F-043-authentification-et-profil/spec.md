---
id: F-043
slug: authentification-et-profil
title: Se connecter, récupérer son mot de passe et tenir son profil
epic: E-016
surface: risquee
dependencies: none
personas: [PER-001, PER-002, PER-003]
---

# Objectif

Chaque personne qui travaille au comptoir entre par un compte nommé, retrouve seule un mot de passe perdu, et tient à jour ses informations personnelles. C'est la porte d'entrée de l'application, et le point où le rôle de départ est attribué.

## Intention

Un comptoir ne peut pas partager un compte unique : au moment de savoir qui a chiffré un lot ou ouvert un dossier, un identifiant commun ne répond rien. Chacun entre donc sous son nom, et la trace suit.

La perte d'un mot de passe ne doit pas immobiliser un vendeur en pleine matinée ni obliger le propriétaire à intervenir : le parcours de récupération se mène seul, depuis l'écran de connexion, avec un lien reçu par courriel.

Enfin, un compte qui vient de naître ne doit rien ouvrir de plus que le travail de comptoir. Le rôle vendeur est attribué d'office, et tout élargissement passe par une décision explicite du propriétaire, jamais par l'inscription elle-même.

## Hors-scope

- l'ouverture d'un compte par le propriétaire pour un collaborateur, qui relève de l'invitation
- le retrait d'un accès, la désactivation et la suppression d'un compte
- les préférences d'affichage, de notification et de raccourcis, qui relèvent du paramétrage personnel

## Cas d'erreur

- l'adresse ou le mot de passe saisis à la connexion ne correspondent à aucun compte : l'accès est refusé par un message unique, qui ne dit pas lequel des deux champs est en cause
- le mot de passe choisi sur l'écran de réinitialisation est plus court que la longueur minimale, ou les deux saisies diffèrent : le changement est refusé et le motif est affiché

## Brief produit

### Purpose

Donner à chaque personne du comptoir une entrée nominative, récupérable sans aide, et un rôle de départ qui n'ouvre que le travail de comptoir.

### User

Le vendeur, qui entre chaque matin et peut perdre son mot de passe. Le propriétaire, qui entre par la même porte avec plus de droits derrière. L'administrateur de la solution, qui intervient au-dessus des deux.

### Content

La connexion demande une adresse et un mot de passe, et propose le lien de récupération. La récupération envoie un courriel, puis conduit à un écran de choix d'un nouveau mot de passe, saisi deux fois. Le profil porte le prénom, le nom, l'adresse en lecture seule, une photo, et une section de changement de mot de passe.

## Notes techniques

La création du profil et l'attribution du rôle vendeur sont faites par la base au moment de la naissance du compte, conformément à R-029 qui veut que l'autorisation soit portée par la base et non par l'écran.

Deux longueurs minimales coexistent aujourd'hui : six caractères sur l'écran de réinitialisation, huit dans la section Sécurité du profil. L'écart est constaté, pas voulu.

Le rappel d'authentification refuse toute destination hors du domaine de l'application (R-030).
