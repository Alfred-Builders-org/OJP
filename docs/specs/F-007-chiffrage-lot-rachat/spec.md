---
id: F-007
slug: chiffrage-lot-rachat
title: Chiffrer un lot de rachat référence par référence au cours du jour
epic: E-002
domaine: [DOM-004, DOM-005, DOM-016]
surface: risquee
dependencies: [F-005, F-042]
personas: [PER-002]
---

# Objectif

Peser, titrer et valoriser chaque objet apporté, en figeant sur le lot le cours du métal et le coefficient utilisés. Le prix proposé au client sort de ces valeurs figées, et il ne bouge plus si les cours changent une heure plus tard.

## Intention

Le client pose une poignée d'objets sur le comptoir et attend un prix. Le vendeur ne peut pas les traiter en bloc : une gourmette en or 18 carats, une chaîne en argent et un lingot d'une once n'ont ni le même métal, ni le même titre, ni la même façon de se valoriser. Chaque objet devient donc une ligne du lot, avec son poids, son titre et son prix, et le total du lot est la somme de ces lignes.

Deux façons de valoriser cohabitent parce que deux natures d'objet cohabitent. Un bijou n'est pas en or pur : son titre en millièmes dit quelle fraction de son poids est du métal fin, et l'oublier surévaluerait le rachat d'un bon quart. Un lingot ou une pièce d'investissement, lui, est en or fin et son poids vient du catalogue, pas de la balance : lui appliquer un titre le dévaluerait sans raison.

Le cours retenu est celui figé sur le lot au moment où il s'ouvre, pas celui du serveur à l'instant du clic. C'est ce qui permet au vendeur d'annoncer un prix ferme et de le tenir : le client qui revient le lendemain retrouve le montant qu'on lui a annoncé, et le comptoir peut expliquer d'où il sort, cours par cours et coefficient par coefficient.

Enfin, le vendeur ne calcule rien et n'additionne rien. Le prix de chaque ligne lui est proposé, et le total du lot se refait tout seul dès qu'une ligne change : un total saisi à la main finirait tôt ou tard en désaccord avec les lignes qu'il prétend résumer, sur un document déjà remis au client.

## Hors-scope

- l'origine du cours et son relevé quotidien, qui appartiennent au socle des cours des métaux
- le choix du régime fiscal et le calcul des taxes, faits plus loin dans le parcours du rachat
- l'émission du devis qui reprend ces montants et la réponse du client

## Cas d'erreur

- une référence de bijou est enregistrée sans désignation, métal, qualité, poids brut, poids net ou quantité : l'enregistrement est refusé et le vendeur lit « Désignation, métal, qualité, poids brut, poids net et quantité sont requis. »

## Brief produit

### Purpose

Transformer un tas d'objets en un chiffrage ligne à ligne défendable : chaque objet porte son poids, son titre, son prix et le cours qui l'a produit, et le total du lot est toujours la somme exacte de ses lignes.

### User

Le vendeur au comptoir, qui pèse, titre et annonce le prix devant le client. Le propriétaire, qui pilote la marge par les coefficients et doit pouvoir refaire le calcul d'une ligne des mois plus tard.

### Content

Pour un bijou : désignation, métal (Or, Argent, Platine), qualité en millièmes (333, 375, 585, 750, 999), poids brut, poids net, quantité, et le prix de rachat pré-rempli par le calcul, que le vendeur peut ajuster. Pour un dépôt-vente s'ajoutent la commission et le prix de revente. Pour un produit d'investissement : la pièce ou le lingot choisi dans le catalogue, la quantité, la présence du scellé et de la facture d'origine, la date et le prix d'acquisition. Chaque ligne conserve le cours du métal et le coefficient qui ont servi à la produire.

## Notes techniques

`calculerPrixRachatBijoux` et `calculerPrixRachatOrInvest` dans `src/lib/calculations/prix-rachat.ts`, couvertes par `src/lib/calculations/prix-rachat.test.ts` ; `safeNum` ramène à 0 tout paramètre non fini ou négatif. Les formulaires sont `src/components/lots/reference-form-bijoux.tsx` et `src/components/lots/reference-form-or-invest.tsx`, qui lisent le cours par `getCoursMetalFromSnapshot` sur `lots.cours_or_snapshot`, `cours_argent_snapshot`, `cours_platine_snapshot` et `coefficient_rachat_snapshot`, jamais sur `parametres`. Chaque `lot_references` stocke `cours_metal_utilise` et `coefficient_utilise`. Les échelles à trois décimales viennent de la migration `130_*.sql` (R-019), le couple poids brut / poids net de `088_add_poids_brut_net.sql`. Le trigger `update_lot_totals` (R-044) recalcule les totaux du lot à chaque écriture de référence. `reference-form-or-invest.tsx:88-117` rattrape le cas des instantanés à 0 en relisant `parametres` et en réécrivant les instantanés du lot : c'est un correctif de terrain, pas le chemin nominal.
