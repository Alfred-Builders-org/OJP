---
id: F-040
slug: releve-quotidien-des-cours
title: Relever une fois par jour les cours de l'or, de l'argent et du platine
epic: E-015
domaine: [DOM-016]
surface: risquee
dependencies: none
personas: [PER-001, PER-002]
---

# Objectif

Un seul relevé par jour, pour qu'un client expertisé le matin et un autre l'après-midi soient traités à l'identique. Le relevé part tout seul à la première ouverture de la journée, et le propriétaire garde la main pour l'actualiser.

## Intention

Le cours du gramme est la matière première de tous les prix du comptoir : sans lui, un chiffrage vaut zéro euro. Jusqu'ici il fallait y penser, l'aller chercher et le saisir, et deux clients reçus le même jour pouvaient repartir avec des prix différents pour le même bijou, simplement parce que quelqu'un avait rafraîchi entre les deux.

Le relevé devient donc un geste de l'application et non plus une discipline humaine : la première personne qui ouvre l'application le matin, vendeur ou propriétaire, déclenche sans le savoir le relevé du jour, et ce cours vaut pour toutes les opérations jusqu'au lendemain. Le vendeur n'a plus à s'en soucier et voit toujours un cours lisible. Le propriétaire, lui, conserve un bouton pour reprendre la main quand la source s'est trompée ou n'a pas répondu.

Le choix qui compte est celui de ne rien écrire à moitié : si un seul des trois métaux manque à l'appel, aucun cours n'est enregistré, et ceux de la veille restent en place. Un cours de la veille est faux de quelques centimes ; un cours à zéro produit des prix de rachat à zéro que personne ne remarque.

## Hors-scope

- le contrôle de vraisemblance du cours relevé, qui refuse un écart aberrant : il appartient à F-041
- la recopie du cours sur le lot et sur les références, qui appartient à F-042
- les coefficients de rachat et de vente, qui transforment un cours en prix et se règlent au paramétrage
- le rythme du relevé, qui reste d'une fois par jour et ne se paramètre pas

## Cas d'erreur

- un seul des trois métaux ne répond pas : rien n'est enregistré, les cours de la veille sont conservés, et la journée reste consommée sans nouvelle tentative automatique avant le lendemain
- le propriétaire actualise à la main et le service de cours est injoignable : l'écran affiche « Le service de cours est injoignable. Réessayez dans un instant. » et les cours en place ne bougent pas

## Brief produit

### Purpose

Garantir qu'à toute heure de la journée, l'application dispose d'un cours du gramme unique, récent et lisible par tout le monde, sans que personne n'ait à y penser.

### User

Le vendeur au comptoir, qui doit voir un cours plutôt qu'un zéro quand il chiffre l'or d'un client. Le propriétaire, seul à pouvoir corriger ou relancer le relevé, et seul à porter la conséquence d'un cours faux.

### Content

Trois cours au gramme, un par métal suivi : or, argent, platine. Chacun se porte au millième d'euro, parce que le centime suffit pour l'or mais fausse l'argent. S'y ajoute la date du dernier relevé tenté, qui dit à quand remonte la valeur affichée.

### Flow

À la première ouverture du tableau de bord de la journée, le relevé se réserve et part en arrière-plan : l'écran s'affiche sans l'attendre et rien n'est montré du relevé lui-même. Les ouvertures suivantes, quel que soit l'utilisateur, ne déclenchent rien. Le propriétaire qui veut reprendre la main passe par Paramètres, onglet Prix, et actionne « Actualiser au cours du marché ».

## Notes techniques

La réservation est un UPDATE conditionnel atomique dans `reserver_maj_cours` (migration 131) qui renvoie un jeton UUID à usage unique (migration 132) : c'est ce jeton qui permet à un vendeur, dépourvu du droit d'écriture sur `parametres`, de déclencher le relevé du matin sans que R-020 soit contournée. Le composant serveur `ReleveCoursQuotidien` est monté sous `<Suspense fallback={null}>` pour ne pas retarder le tableau de bord. Le client `goldapi.ts` interroge XAU/EUR, XAG/EUR et XPT/EUR en parallèle et lit `price_gram_24k` ; l'échec d'un seul métal rejette l'ensemble. `parametres.cours_maj_le` trace la tentative et non le succès, conformément à R-018, ce qui protège le quota du plan gratuit. L'écriture passe toujours par `appliquer_cours`, y compris depuis `POST /api/cours`, pour que la date de relevé reste cohérente entre le chemin automatique et le bouton manuel. La précision au millième vient de la migration 130 (R-019).
