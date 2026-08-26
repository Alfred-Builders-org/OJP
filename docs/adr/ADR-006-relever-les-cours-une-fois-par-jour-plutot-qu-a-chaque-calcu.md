---
id: ADR-006
title: Relever les cours une fois par jour plutôt qu'à chaque calcul
status: accepted
---

## Contexte

Les prix de rachat dépendent du cours du métal. Appeler la source à chaque chiffrage aurait consommé le quota de l'interface tierce et rendu deux expertises du même jour incomparables.

## Décision

Les cours sont relevés une fois par jour, à la première ouverture de l'application, par une réservation atomique. La date enregistre la tentative et non le succès : une source injoignable consomme la journée plutôt que de déclencher une boucle de tentatives.

## Conséquences

Un client expertisé le matin et un autre l'après-midi sont traités au même cours, ce qui est le comportement attendu du métier. Si la source est indisponible, les cours de la veille sont conservés et un bouton manuel reste disponible.

## Alternatives

Un relevé à la demande à chaque calcul aurait donné un prix plus juste à l'instant, au prix de l'équité entre deux clients du même jour.
