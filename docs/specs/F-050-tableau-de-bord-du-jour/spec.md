---
id: F-050
slug: tableau-de-bord-du-jour
title: Donner au propriétaire la vue du jour : chiffres clés, alertes, activité
epic: E-018
surface: standard
domaine: [DOM-004, DOM-013]
dependencies: [F-003, F-039]
personas: [PER-001]
---

# Objectif

Ce qu'il faut regarder en ouvrant l'application le matin : quatre chiffres du mois, les échéances qui appellent une décision, les lots et commandes en cours, l'activité récente. Chaque bloc se charge pour son compte, de sorte qu'une donnée indisponible n'emporte pas le reste de la vue.

## Intention

Le propriétaire ouvre le comptoir et veut savoir en un écran ce qui l'attend : un délai de rétractation qui vient de tomber, un devis parti depuis trois jours sans réponse, une pièce d'identité qui va périmer et bloquera l'ouverture du prochain dossier, un rachat finalisé dont le client n'a pas encore été payé. Sans cette vue, ces échéances ne se voient qu'en ouvrant chaque dossier un par un, et celles qu'on n'ouvre pas passent inaperçues.

Le second enjeu est la confiance : une vue qui tombe entièrement parce qu'une seule requête a échoué finit par ne plus être ouverte. Chaque bloc vit donc sa vie, et une carte muette laisse les autres lisibles.

Enfin, la vue doit être juste sur l'argent. Un lot rétracté ou refusé porte la même marque de finalisation qu'un lot mené à terme, et réclamer un versement dessus enverrait le propriétaire payer une marchandise que la boutique n'a jamais acquise.

## Hors-scope

- la création ou la modification d'une opération : la vue conduit vers l'écran concerné, elle n'écrit rien
- les états financiers et les exports comptables, qui vivent dans leurs propres écrans
- le choix par l'utilisateur des blocs affichés ou de leur ordre : la composition de la vue est fixe

## Cas d'erreur

- un lot de rachat rétracté, refusé ou annulé reste marqué finalisé : il est écarté des paiements dus, faute de quoi la vue réclamerait un versement pour une opération sans suite
- un bloc de la vue ne parvient pas à charger ses données : il s'affiche vide, les autres blocs restent lisibles et la page ne tombe pas

## Brief produit

### Purpose

Ramener en un écran ce qui appelle une décision aujourd'hui, et rien d'autre. Tout ce qui s'y affiche est un chemin vers l'opération concernée.

### User

Le propriétaire du comptoir, premier à ouvrir l'application le matin, qui décide des prix et suit la marge. Le vendeur y lit aussi les échéances de son parcours, sans les blocs qui lui sont fermés.

### Content

Un accueil nominatif et des actions rapides, puis quatre chiffres du mois : chiffre d'affaires avec sa comparaison au mois précédent, marge brute des rachats finalisés, valeur du stock, montant en attente sur les ventes en cours.

Quatre cartes ensuite : Alertes et Délais, Lots, Commandes, Activité. La carte des alertes agrège cinq familles : délais de rétractation écoulés ou en cours, devis en attente de réponse, références sous délai, pièces d'identité proches de l'expiration, paiements dus. Le seuil d'alerte sur les pièces d'identité se règle dans les paramètres et vaut trente jours par défaut.

## Notes techniques

La page vit dans `src/app/(dashboard)/dashboard/page.tsx` et délègue chaque bloc à un composant serveur isolé dans son propre `<Suspense>` avec un `Skeleton`. Chaque requête passe par le helper `safe()` de `src/components/dashboard/dashboard-helpers.ts`, qui neutralise une erreur isolée.

Le filtre des paiements dus est `FILTRE_OPERATION_ABOUTIE` du même fichier, équivalent PostgREST de `isOperationAboutie` : `outcome` nul ou hors de `retracte, refuse, annule`. Couvert par `src/components/dashboard/dashboard-helpers.test.ts`.

Le seuil `seuil_alerte_identite_jours` est lu dans `settings.value` sous la clé `business_rules`, avec un repli à 30. Le composant `ReleveCoursQuotidien` est monté sans rendu visible et déclenche le relevé du jour.
