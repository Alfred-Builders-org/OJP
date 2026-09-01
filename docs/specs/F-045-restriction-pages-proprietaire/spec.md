---
id: F-045
slug: restriction-pages-proprietaire
title: Réserver au propriétaire les pages et actions sensibles
epic: E-016
surface: risquee
dependencies: [F-043]
personas: [PER-001, PER-002, PER-003]
---

# Objectif

Les fonderies, les commandes, le routage, le suivi, les impôts, les paramètres et la gestion des comptes sont réservés au propriétaire et à l'administrateur de la solution. Un vendeur ne les voit pas dans son menu, ne les atteint pas en tapant l'adresse, et n'en obtient pas les données.

## Intention

Un vendeur reçoit les clients et chiffre leur or. Les fonderies, les commandes, les seuils et les comptes sont les leviers qui fixent la marge, les partenaires et les accès : ce sont des décisions de propriétaire, et les exposer à tout le comptoir revient à les rendre modifiables par accident.

La restriction se joue à trois étages, et c'est délibéré. Le menu n'affiche pas ce qui est fermé, pour ne pas promettre une page qui se remplirait de vide. L'adresse tapée à la main renvoie au tableau de bord. Et surtout, la donnée elle même refuse de sortir : c'est le seul étage sur lequel on compte vraiment, parce qu'il tient quel que soit le chemin emprunté.

Une exception a été apprise à ses dépens : les cours et les seuils qui portent les prix doivent rester lisibles par tout le monde. Fermés, ils faisaient chiffrer des lots à zéro sans le moindre avertissement au vendeur. Ils sont donc ouverts en lecture et fermés en écriture.

## Hors-scope

- l'ouverture et la fermeture des comptes eux mêmes, qui relèvent de l'invitation et de la suppression
- ce que font les écrans une fois ouverts : cette feature dit qui entre, pas ce qui s'y passe
- la limitation en débit des routes de service, qui protège d'un autre risque

## Cas d'erreur

- une page réservée est ouverte sans session en cours : la personne est renvoyée vers la page de connexion, et les routes de service correspondantes refusent la demande au lieu de rendre une page

## Brief produit

### Purpose

Faire que le périmètre visible par une personne découle de son rôle, et que la donnée elle même refuse de sortir quand le rôle ne l'autorise pas.

### User

Le vendeur, dont le menu se limite aux clients, aux dossiers, aux lots, aux ventes et au stock. Le propriétaire, qui voit tout. L'administrateur de la solution, qui porte les droits du propriétaire et au-delà.

### Content

Trois groupes disparaissent du menu d'un vendeur : Comptabilité avec les impôts, Fonderie avec les fonderies, le routage et le suivi, et Administration avec les utilisateurs. Les cours et les seuils restent lisibles par tous. L'actualisation des cours, l'envoi de courriels et la gestion des comptes affichent un refus explicite quand le rôle ne suffit pas.

## Notes techniques

Les trois étages sont le menu latéral, la garde de page qui renvoie au tableau de bord, et les politiques de sécurité au niveau des lignes portées par la base (R-029), qui sont les seules à protéger réellement.

L'ouverture en lecture des paramètres date de la migration qui a suivi l'incident des prix à zéro (R-020). Un jeton à usage unique permet à un vendeur de déclencher le relevé du matin sans obtenir le droit d'écriture.

Un composant de rendu conditionnel par rôle existe pour les blocs d'écran, et douze pages protégées ainsi que trois routes de service sont couvertes par le test de sécurité de bout en bout.
