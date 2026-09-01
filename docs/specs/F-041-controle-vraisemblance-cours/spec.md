---
id: F-041
slug: controle-vraisemblance-cours
title: Refuser un cours manifestement aberrant saisi à la main
epic: E-015
domaine: [DOM-016]
surface: risquee
dependencies: [F-040]
personas: [PER-001]
---

# Objectif

Une virgule mal placée fausse toutes les transactions de la journée ; l'écart au dernier relevé est contrôlé. Au-delà de 30 % d'écart, le cours est refusé et le motif est dit au propriétaire.

## Intention

Le comptoir a déjà payé ce défaut : une référence « Bracelet » de 90 grammes d'argent avait été valorisée 3 439,06 euros parce que le cours de l'argent avait été enregistré à 45,00 euros le gramme, alors qu'il tourne autour de 1,80. Le calcul était juste, la donnée ne l'était pas, et rien dans l'application ne s'y était opposé. L'erreur ne se voit qu'au moment où l'on paie le client, c'est-à-dire trop tard.

Le contrôle rend cette faute impossible à commettre en silence. Un écart de plus de 30 % avec le dernier cours connu arrête l'enregistrement et affiche ce qui cloche : quel métal, quelle valeur proposée, quelle valeur précédente. Le seuil est volontairement large, parce que les métaux précieux ne bougent pas d'un tiers en une journée : ce qu'il attrape, ce n'est pas une variation de marché, c'est une virgule déplacée ou un métal saisi dans la mauvaise case.

Le propriétaire reste maître de la décision quand l'écart est réel. Le relevé automatique, lui, n'a le droit de rien forcer : s'il est refusé, les cours de la veille sont conservés, exactement comme si la source n'avait pas répondu. Un contrôle qu'un automate peut contourner ne protège personne.

## Hors-scope

- le déclenchement et le rythme du relevé quotidien, qui appartiennent à F-040
- la première saisie sur un comptoir neuf : un cours précédent à zéro signifie « jamais relevé » et n'est comparé à rien
- la justesse du cours lui-même : le contrôle dit qu'une valeur est invraisemblable, jamais qu'elle est exacte
- le réglage du seuil de 30 %, qui n'est pas offert au paramétrage

## Cas d'erreur

- l'un des trois prix n'est pas strictement positif : l'enregistrement est refusé au motif que les trois métaux doivent être strictement positifs, et aucun cours n'est modifié
- la saisie manuelle contient une valeur qui n'est pas un nombre : l'écran affiche « Veuillez saisir des valeurs numériques valides pour les prix. » et rien n'est enregistré

## Brief produit

### Purpose

Empêcher qu'un cours faux entre dans l'application, et le dire assez clairement pour que la personne qui l'a saisi sache quoi corriger.

### User

Le propriétaire du comptoir, seul à saisir ou à actualiser un cours, et seul à pouvoir décider qu'un écart important est réel.

### Content

Le message de refus nomme le métal, rappelle la valeur proposée et la valeur du dernier relevé, toutes deux au millième d'euro, puis invite à vérifier la saisie ou à passer outre si l'écart est réel. Exemple : « Cours de l'argent invraisemblable : 45,000 EUR/g contre 1,800 EUR/g au dernier relevé. Vérifiez la saisie, ou forcez si l'écart est réel. »

### Flow

Le propriétaire saisit ou actualise les trois prix depuis Paramètres, onglet Prix. Le refus apparaît à l'enregistrement, avec le message ci-dessus. Les cours en place ne changent pas tant qu'une valeur vraisemblable n'a pas été enregistrée.

## Notes techniques

Le contrôle vit dans `appliquer_cours` (migration 136), avec `ecart_max` fixé à 0,30 et un `ERRCODE` `check_violation` : la garde est tenue par la base et non par l'écran, ce qui la rend incontournable quel que soit l'appelant. La positivité est vérifiée avant toute comparaison. La dérogation passe par `p_forcer`, réimposé à `FALSE` dès qu'un jeton de relevé est présent, ce qui matérialise le « le relevé automatique ne force jamais » de R-017. La route `POST /api/cours` reconnaît la chaîne « invraisemblable » dans le message et le renvoie verbatim en 409 ; toute autre erreur d'écriture devient « Les cours ont été récupérés mais n'ont pas pu être enregistrés. » en 500. Le contrôle de format des trois champs reste côté formulaire (`parametres-form.tsx`), en amont de l'appel.
