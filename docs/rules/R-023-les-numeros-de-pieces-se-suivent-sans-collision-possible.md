---
id: R-023
title: Les numéros de pièces se suivent sans collision possible
statement: Dossiers, lots et documents reçoivent un numéro séquentiel annuel par type, attribué sous verrou consultatif de transaction : deux saisies simultanées ne peuvent pas obtenir le même numéro.
enforcement: constraint
surface: documents
priority: 1
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-006
---

## Où elle est tenue

`supabase/migrations/055_*.sql` et les six fonctions `generate_*_numero`, chacune sous `pg_advisory_xact_lock`.

## Pourquoi

Deux vendeurs qui créent un document à la même seconde obtiendraient le même numéro avec un simple « dernier plus un ». Deux quittances portant le même numéro sont un problème comptable, pas un désagrément d'affichage.

Le verrou consultatif de transaction sérialise l'attribution sans verrouiller la table entière. Chaque type de pièce a sa propre séquence annuelle et son préfixe, réglable en paramètres.
