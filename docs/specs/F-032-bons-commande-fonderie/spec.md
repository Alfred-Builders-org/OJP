---
id: F-032
slug: bons-commande-fonderie
title: Émettre les bons de commande fonderie et les suivre jusqu'au paiement
epic: E-010
domaine: [DOM-012, DOM-014]
surface: standard
dependencies: [F-031, F-034]
personas: [PER-001, PER-005]
---

# Objectif

Grouper par fonderie les références routées vers elle en un bon de commande numéroté, puis suivre ce bon de son envoi jusqu'à son règlement. C'est la pièce qui engage la maison auprès du partenaire.

## Intention

Une répartition qui reste dans un écran n'engage personne. Le partenaire, lui, a besoin d'une pièce lisible : ce qu'on lui demande, en quelles quantités, à quel prix, et à quel nom. Tant que cette pièce n'existe pas, la commande vit dans une conversation téléphonique, et le jour où le fondeur livre autre chose que ce qui était entendu, il n'y a rien à comparer.

Le bon de commande est cette pièce. Il rassemble en une seule fois tout ce qui part chez un même partenaire, porte un numéro qui le désigne sans ambiguïté des deux côtés, et affiche un montant qui est toujours celui de ses lignes présentes, jamais un chiffre recopié.

Une fois émis, il ne se referme pas tout seul. Il s'envoie, il se reçoit ligne à ligne ou d'un coup selon ce qui arrive, il se paie, et à chaque étape le tableau de bord du jour rappelle ce qu'il attend de quelqu'un : un envoi à faire, une réception en attente, un paiement fonderie à effectuer. Le propriétaire n'a donc pas à se souvenir de la filière, elle se rappelle à lui.

## Hors-scope

- la décision de ce qui part chez quel partenaire, qui se prend au routage : ici les lignes arrivent déjà orientées
- le poids et le titre que le fondeur retient après affinage, qui se constatent à la réception de sa livraison
- les coordonnées et l'existence même du partenaire, qui viennent du référentiel des fonderies

## Cas d'erreur

- un bon de commande est annulé : le bon garde la trace de son annulation, ses lignes reviennent à dispatcher et aucune ne reste rattachée à la fonderie

## Brief produit

### Purpose

Donner au partenaire une pièce qui dit exactement ce qu'on lui demande, et à la maison un fil qu'elle peut suivre de l'envoi au paiement sans rien noter à côté.

### User

Le propriétaire du comptoir, qui émet le bon, en suit les réceptions et en règle le montant. La fonderie partenaire, destinataire du bon, qui n'utilise pas l'application mais dont tout le travail part de cette pièce.

### Content

Un bon porte un numéro de la forme BDC-2026-0001, une fonderie destinataire, un statut parmi Brouillon, Envoyé, Reçu, Payé et Annulé, un montant total, et ses lignes avec désignation, métal, poids, quantité, prix unitaire et total.

Sa fiche enchaîne les gestes du cycle : l'envoyer, marquer une ligne reçue ou déclarer le tout reçu, l'annuler. Le tableau de bord du jour reprend l'état courant sous une formulation d'action : « À envoyer », « En attente de réception », « Paiement fonderie à effectuer », ce dernier en priorité urgente.

La page de suivi présente d'une même liste, triée par date, les bons de commande adressés aux partenaires et les bons de livraison qui les accompagnent.

## Notes techniques

`createBonsCommande` groupe les lignes par `fonderie_id`, insère un `bons_commande` dont le numéro est posé par le déclencheur `generate_bon_commande_numero`, rattache les `vente_lignes` (`bon_commande_id`, `fonderie_id`, `fulfillment = 'commande'`) et émet le PDF `bon_commande`, préfixe CMDF. Le `montant_total` est tenu par `update_bon_commande_total` (035_create_bons_commande.sql), conformément à R-044 : aucune écriture applicative ne le fixe. La page est réservée au propriétaire par `OWNER_ONLY_PREFIXES` (R-028). Le passage en `paye` est fait par `reglement-dialog.tsx` quand un `PaymentDue` de type `fonderie` couvre le montant. L'annulation repasse les lignes en `a_commander` et vide `bon_commande_id` et `fonderie_id`.
