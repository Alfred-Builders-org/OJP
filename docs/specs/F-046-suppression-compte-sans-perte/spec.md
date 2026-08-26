---
id: F-046
slug: suppression-compte-sans-perte
title: Désactiver ou supprimer un compte sans perdre l'historique qu'il a produit
epic: E-016
surface: risquee
dependencies: [F-043, F-045]
personas: [PER-001, PER-003]
---

# Objectif

Fermer un accès coupe l'entrée sans effacer le travail déjà produit : les mentions de la personne qui a créé un lot, un dossier ou un client restent lisibles. L'adresse, elle, redevient disponible pour un futur compte.

## Intention

Quand quelqu'un s'en va, la tentation est d'effacer son compte. Mais tout ce qu'il a produit porte son nom : les lots qu'il a pesés, les dossiers qu'il a ouverts, les clients qu'il a enregistrés. Effacer le compte rendrait l'historique illisible au moment précis où l'on cherche à comprendre qui a fait quoi, souvent des mois plus tard, souvent sous contrôle.

Le compte est donc conservé et fermé : la personne n'entre plus, son nom reste. En contrepartie, son adresse resterait immobilisée à jamais, ce qui interdirait de rouvrir un accès à la même personne si elle revient, ou d'attribuer une adresse de fonction à son successeur. Elle est donc libérée.

Entre ne rien faire et fermer définitivement, il y a la désactivation : un compte suspendu le temps d'une absence, qui se rouvre d'un geste. C'est le cas courant, et c'est celui qu'on veut voir choisi le plus souvent.

Enfin, personne ne doit pouvoir se fermer soi-même la porte, ni fermer celle de quelqu'un placé plus haut : ces gestes ne se rattrapent pas facilement, et ils sont refusés en le disant.

## Hors-scope

- l'ouverture d'un accès, qui relève de l'invitation
- l'effacement des données du client particulier, qui obéit à ses propres obligations
- la restitution du contenu produit par la personne, qui reste attaché aux lots et aux dossiers

## Cas d'erreur

- la suppression vise le compte de la personne qui la demande, un administrateur de la solution, ou un propriétaire alors que le demandeur n'est pas administrateur de la solution : elle est refusée avec le motif
- le compte est bien fermé mais son adresse n'a pas pu être libérée : le demandeur en est averti et sait que cette adresse ne sera pas réutilisable

## Brief produit

### Purpose

Fermer un accès sans casser l'historique, et rendre l'adresse disponible pour la suite.

### User

Le propriétaire du comptoir, qui ferme l'accès d'un collaborateur qui s'en va ou le suspend le temps d'une absence. L'administrateur de la solution, qui est le seul à pouvoir fermer l'accès d'un propriétaire.

### Content

La gestion des utilisateurs propose deux gestes : désactiver, qui suspend et se lève, et supprimer, qui ferme. Un compte fermé disparaît de la liste mais son nom continue d'apparaître dans les mentions de création. Chaque geste refusé affiche son motif en clair.

## Notes techniques

La suppression est logique : le profil passe à l'état supprimé et l'accès est banni pour une durée qui vaut définitif. L'adresse est ensuite neutralisée aux deux endroits où le service d'authentification la stocke, l'originale étant conservée dans les métadonnées avec sa date de fermeture. L'opération est rejouable sans effet de bord (R-027).

Le changement de rôle et le caractère actif sont protégés en base par la garde de R-041, qui réécrit les valeurs plutôt que de lever une erreur.
