---
id: F-048
slug: coefficients-de-marge
title: Régler les coefficients de rachat et de vente appliqués aux calculs
epic: E-017
domaine: [DOM-005]
surface: risquee
dependencies: none
personas: [PER-001]
---

# Objectif

Deux coefficients, un pour le rachat et un pour la vente, transforment le cours du métal en prix d'achat et en prix de revente. Ils se règlent depuis l'écran des paramètres et se figent sur le lot au moment où il est créé.

## Intention

La marge de la maison ne se saisit pas prix par prix : elle se pilote par un coefficient, et c'est ce qui permet au propriétaire de la déplacer d'un point sans reprendre un seul chiffrage. Le coefficient de rachat dit ce que le comptoir paie par rapport au cours, celui de vente ce qu'il demande à la revente ; ensemble ils décrivent la position commerciale du comptoir sur une journée.

Le geste a une portée que l'écran ne montre pas : un coefficient changé change tous les prix annoncés ensuite. C'est pour cela qu'il est borné à la saisie, et surtout qu'il est recopié sur le lot dès sa création. Un dossier chiffré la semaine dernière doit rester explicable avec le coefficient qui avait cours ce jour-là, même si le propriétaire l'a déplacé depuis. Sans cette copie, rouvrir un dossier ancien afficherait un prix que personne n'a jamais annoncé au client.

## Hors-scope

- le coefficient par produit ou par référence : la marge est globale, et l'ajustement objet par objet passe par la saisie d'un prix de rachat ou de revente manuel qui écrase le calcul
- les cours des métaux eux-mêmes, qui sont relevés et contrôlés ailleurs
- la fiscalité appliquée au-dessus du prix obtenu

## Cas d'erreur

- un coefficient saisi hors de ses bornes est refusé et rien n'est enregistré : au-delà de 2 pour le rachat, l'écran affiche « Le coefficient de rachat doit être entre 0 et 2. », au-delà de 3 pour la vente, « Le coefficient de vente doit être entre 0 et 3. »

## Brief produit

### Purpose

Donner au propriétaire un unique levier de marge, borné et daté, qui vaut pour tous les chiffrages ouverts après lui et pour aucun de ceux ouverts avant.

### User

Le propriétaire du comptoir, seul habilité à ouvrir les paramètres et à décider des prix. Le vendeur en voit le résultat sous la forme du prix qu'il annonce au client.

### Content

L'écran « Prix & Coefficients » réunit les trois cours au gramme (or, argent, platine, au millième d'euro) et les deux coefficients. Le coefficient de rachat vaut 0,8500 par défaut, celui de vente 1,05. Les deux s'enregistrent ensemble avec les cours.

Le prix de rachat d'un bijou vaut cours du métal au gramme, multiplié par le titre en millièmes rapporté à mille, par le poids, puis par le coefficient de rachat. Celui d'un lingot ou d'une pièce d'investissement ignore le titre, parce que ces produits sont en or fin. Le prix de revente reprend la même base avec le coefficient de vente.

## Notes techniques

La table `parametres` (ligne unique `id = 1`) porte `coefficient_rachat NUMERIC(5,4) DEFAULT 0.8500` (migration `008_create_parametres.sql`) et `coefficient_vente` par défaut 1.05 (migration `011_add_coefficient_vente.sql`). La validation des bornes vit dans `prixSaveFn` de `src/components/parametres/parametres-form.tsx`, avant le double appel `savePrix` / `saveCoeff`.

Les deux valeurs sont recopiées à la création du lot dans `coefficient_rachat_snapshot` et `coefficient_vente_snapshot`, puis lues par `calculerPrixRachatBijoux` et `calculerPrixRachatOrInvest` de `src/lib/calculations/prix-rachat.ts` (R-001, R-002). Aucune surcharge par produit n'existe : ni colonne dans `or_investissement`, ni champ de catalogue ; `lot_references.coefficient_utilise` n'est qu'une trace a posteriori du coefficient effectivement appliqué. R-024 range ces deux coefficients avec les autres réglages.
